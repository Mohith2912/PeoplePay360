param(
    [string]$Url = 'https://model-lens-nine.vercel.app/',
    [string]$OutputDirectory = 'E:\PeoplePay360\screenshots'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http

$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$profilePath = Join-Path $OutputDirectory '.chrome-profile'
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $profilePath | Out-Null

$chromeArgs = @(
    '--headless=new'
    '--disable-gpu'
    '--hide-scrollbars'
    '--remote-debugging-port=9223'
    "--user-data-dir=$profilePath"
    '--window-size=1536,900'
    $Url
)

$chrome = Start-Process -FilePath $chromePath -ArgumentList $chromeArgs -PassThru -WindowStyle Hidden

try {
    $tabs = $null
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        try {
            $tabs = Invoke-RestMethod -Uri 'http://127.0.0.1:9223/json' -TimeoutSec 2
            if ($tabs) { break }
        } catch {
            Start-Sleep -Milliseconds 200
        }
    }

    $page = $tabs | Where-Object { $_.type -eq 'page' -and $_.url -like 'https://model-lens-nine.vercel.app/*' } | Select-Object -First 1
    if (-not $page) { throw 'Dashboard page was not available through Chrome DevTools.' }

    $socket = [System.Net.WebSockets.ClientWebSocket]::new()
    $socket.ConnectAsync([Uri]$page.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
    $nextId = 0

    function Invoke-Cdp {
        param([string]$Method, [hashtable]$Params = @{})
        $script:nextId++
        $id = $script:nextId
        $message = @{ id = $id; method = $Method; params = $Params } | ConvertTo-Json -Depth 12 -Compress
        $bytes = [Text.Encoding]::UTF8.GetBytes($message)
        $segment = [ArraySegment[byte]]::new($bytes)
        $socket.SendAsync($segment, [Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null

        while ($true) {
            $stream = [IO.MemoryStream]::new()
            do {
                $buffer = New-Object byte[] 65536
                $received = $socket.ReceiveAsync([ArraySegment[byte]]::new($buffer), [Threading.CancellationToken]::None).GetAwaiter().GetResult()
                $stream.Write($buffer, 0, $received.Count)
            } until ($received.EndOfMessage)
            $json = [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
            if ($json.id -eq $id) {
                if ($json.error) { throw "$Method failed: $($json.error.message)" }
                return $json.result
            }
        }
    }

    function Invoke-JavaScript {
        param([string]$Expression, [switch]$Await)
        for ($attempt = 0; $attempt -lt 8; $attempt++) {
            try {
                $result = Invoke-Cdp 'Runtime.evaluate' @{
                    expression = $Expression
                    awaitPromise = [bool]$Await
                    returnByValue = $true
                }
                return $result.result.value
            } catch {
                if ($attempt -eq 7) { throw }
                Start-Sleep -Milliseconds 300
            }
        }
    }

    function Save-ElementScreenshot {
        param([string]$Expression, [string]$FileName)
        $box = Invoke-JavaScript "(() => { const e = $Expression; e.scrollIntoView({block:'center'}); return new Promise(resolve => setTimeout(() => { const r=e.getBoundingClientRect(); resolve({x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}); }, 1200)); })()" -Await
        $shot = Invoke-Cdp 'Page.captureScreenshot' @{
            format = 'png'
            fromSurface = $true
            captureBeyondViewport = $true
            clip = @{ x = [double]$box.x; y = [double]$box.y; width = [double]$box.width; height = [double]$box.height; scale = 1 }
        }
        [IO.File]::WriteAllBytes((Join-Path $OutputDirectory $FileName), [Convert]::FromBase64String($shot.data))
    }

    Invoke-Cdp 'Page.enable' | Out-Null
    Invoke-Cdp 'Runtime.enable' | Out-Null
    Invoke-JavaScript "new Promise(resolve => { const started=Date.now(); const timer=setInterval(() => { const e=document.querySelector('#chart-card-switching'); if ((e && e.getBoundingClientRect().width > 0) || Date.now()-started > 10000) { clearInterval(timer); setTimeout(resolve,1200); } },100); })" -Await | Out-Null

    Save-ElementScreenshot "document.querySelector('#chart-card-switching')" 'slide-3-model-switching-impact.png'
    Save-ElementScreenshot "document.querySelector('#overview-kpi-grid')" 'slide-4-metric-cards.png'
    Save-ElementScreenshot "Array.from(document.querySelectorAll('div')).find(e => (e.innerText || '').startsWith('SCATTER DISTRIBUTION: MODEL SWITCHES VS. TIME SPENT (MINUTES)') && e.className.includes('border-t'))" 'slide-6-switching-vs-duration.png'

    Invoke-JavaScript "window.scrollTo(0,0); new Promise(resolve => setTimeout(resolve, 400))" -Await | Out-Null
    $metrics = Invoke-Cdp 'Page.getLayoutMetrics'
    $full = Invoke-Cdp 'Page.captureScreenshot' @{
        format = 'png'
        fromSurface = $true
        captureBeyondViewport = $true
        clip = @{ x = 0; y = 0; width = [double]$metrics.cssContentSize.width; height = [double]$metrics.cssContentSize.height; scale = 1 }
    }
    [IO.File]::WriteAllBytes((Join-Path $OutputDirectory 'slide-8-full-worklens-dashboard.png'), [Convert]::FromBase64String($full.data))

    $socket.Dispose()
    Get-ChildItem -LiteralPath $OutputDirectory -Filter '*.png' | Select-Object Name, Length
}
finally {
    if ($chrome -and -not $chrome.HasExited) { Stop-Process -Id $chrome.Id -Force }
}
