const bntEl = document.querySelector('.btn')
bntEl.addEventListener('click',()=>{
    let nome = document.querySelector('.nome').value
    let email = document.querySelector('.email').value
    let senha = document.querySelector('.senha').value
    if(!nome||!email|| !senha){
        
    }
    const Admin  = {
        'nome':nome,
        'email' : email,
        'senha' : senha
    }
    fetch('/auth/setup',{
        method :"POST",
        headers :{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(Admin)
    })
    .then(resp=> resp.json())
    .then(data=>{
        if(data.status === "ok"){
            window.location.href = data.redirect
        }
        else{
            const paEl = document.querySelector('.resul')
            paEl.innerHTML =`${data.message}`
        }
    })
})