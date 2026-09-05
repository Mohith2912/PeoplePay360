import {handler,reply,HR} from '@/modules/integration/http';
import {prisma} from '@/lib/prisma';
// HR may select a structure for a contract without reading salary rules.
export const GET=handler(async()=>reply(await prisma.salaryStructure.findMany({where:{isActive:true},select:{id:true,name:true,code:true}})),HR);
