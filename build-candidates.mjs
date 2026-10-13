import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
for(const id of ['claude','fable']){
  const cwd=fileURLToPath(new URL(`./candidates/${id}/`,import.meta.url));
  for(const args of [['node_modules/typescript/bin/tsc','--noEmit'],['--experimental-strip-types','--test','domain.test.ts',...(id==='claude'?['design.test.ts','review.test.ts','edition.test.ts']:[])],['node_modules/vite/bin/vite.js','build'],...(id==='claude'?[['node_modules/vite/bin/vite.js','build','--mode','ip-2'],['node_modules/vite/bin/vite.js','build','--mode','ip-3']]:[])]){
    const actual=args[0].startsWith('node_modules/')?[root+args[0],...args.slice(1)]:args;
    const result=spawnSync(process.execPath,actual,{cwd,stdio:'inherit'});
    if(result.status!==0)process.exit(result.status??1);
  }
}
