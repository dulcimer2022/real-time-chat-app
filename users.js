function isValid(username) {
    let isValid = true;
    isValid = !!username && username.trim();
    isValid = isValid && username.match(/^[A-Za-z0-9_]+$/);
    return isValid;
  }

const registry = new Set(['admin']);  

function register(username){
    if(!isValid(username)){ return { ok:false, error:'invalid-username' }; }
    if(registry.has(username)){ return { ok:false, error:'user-exists' }; }
    registry.add(username);
    return { ok:true };
}
  
function isRegistered(username){
    return registry.has(username);
}
  
export default {
    isValid,
    register,
    isRegistered,
};

