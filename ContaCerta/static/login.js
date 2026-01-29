const bntEl = document.querySelector('.btn')
bntEl.addEventListener('click',()=>{
    const nome = document.querySelector('.nome').value
    const senha = document.querySelector('.senha').value
    const Pessoa = {
        "nome" : nome,
        "senha" : senha
    }
    fetch('/login',{
        method : "POST",
        headers :{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(Pessoa)
    })
        .then(resp => resp.json())
        .then(data =>{
            if (data.status ==="ok"){
                window.location.href = data.redirect
        }
            else{
                const pEl = document.querySelector('.resul')
                pEl.innerHTML = `${data.message}`

        }
    })
})
