import { BusinessRuleError } from "@/lib/errors";
const tokenPattern = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|([+\-*/()]))/y;
export function evaluateFormula(expression, variables) {
    const tokens = [];
    let position = 0;
    while (position < expression.length) {
        tokenPattern.lastIndex = position;
        const match = tokenPattern.exec(expression);
        if (!match)
            throw new BusinessRuleError("Formula contains an unsupported token");
        position = tokenPattern.lastIndex;
        tokens.push(match[1] ? { kind: "number", value: match[1] } : match[2] ? { kind: "name", value: match[2] } : { kind: "operator", value: match[3] });
    }
    let index = 0;
    const peek = () => tokens[index];
    const consume = (value) => {
        const token = tokens[index++];
        if (!token || (value && token.value !== value))
            throw new BusinessRuleError("Invalid salary formula");
        return token;
    };
    const factor = () => {
        if (peek()?.value === "(") {
            consume("(");
            const result = expressionValue();
            consume(")");
            return result;
        }
        const token = consume();
        if (token.kind === "number")
            return Number(token.value);
        if (token.kind === "name" && token.value in variables)
            return variables[token.value];
        throw new BusinessRuleError(`Unknown formula variable: ${token.value}`);
    };
    const term = () => {
        let result = factor();
        while (peek()?.value === "*" || peek()?.value === "/") {
            const operator = consume().value;
            const right = factor();
            if (operator === "/" && right === 0)
                throw new BusinessRuleError("Salary formula cannot divide by zero");
            result = operator === "*" ? result * right : result / right;
        }
        return result;
    };
    const expressionValue = () => {
        let result = term();
        while (peek()?.value === "+" || peek()?.value === "-") {
            const operator = consume().value;
            const right = term();
            result = operator === "+" ? result + right : result - right;
        }
        return result;
    };
    const result = expressionValue();
    if (index !== tokens.length || !Number.isFinite(result))
        throw new BusinessRuleError("Invalid salary formula");
    return result;
}
