const fetch = require('node-fetch');
const base = 'http://localhost:5000';

async function go(){
  try{
    const list = [
      {label:'HEALTH', url:'/api/health', method:'GET'},
      {label:'DAMS', url:'/api/data/dams', method:'GET'},
      {label:'RISK_ALL', url:'/api/risk/all', method:'GET'},
      {label:'ALERTS', url:'/api/risk/alerts', method:'GET'},
      {label:'DISTRIBUTION', url:'/api/risk/distribution', method:'GET'}
    ];

    for(const e of list){
      const r = await fetch(base + e.url);
      const j = await r.json();
      console.log('---', e.label, '---');
      console.log(JSON.stringify(j, null, 2));
      console.log('\n');
    }

    // POST calculate for dam d1
    const post = await fetch(base + '/api/risk/calculate', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ damId: 'd1' }) });
    const pj = await post.json();
    console.log('--- RISK_CALCULATE (d1) ---');
    console.log(JSON.stringify(pj, null, 2));
  }catch(err){
    console.error('Error during checks:', err.message);
    process.exit(2);
  }
}

go();
