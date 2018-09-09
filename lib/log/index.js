module.exports = function(){
  if(process.env.LOG_LEVEL==='silent'){
    return;
  }
  console.log.apply(this, [].slice.call(arguments))
}
