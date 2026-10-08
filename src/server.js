const http = require("http");
const port = Number(process.env.PORT || 8080);
const server = http.createServer((req,res)=>{
  res.setHeader("content-type","application/json");
  if(req.url === "/health") return res.end(JSON.stringify({ok:true}));
  res.statusCode=404; res.end(JSON.stringify({error:"not_found"}));
});
server.listen(port, ()=>console.log(`listening on ${port}`));
