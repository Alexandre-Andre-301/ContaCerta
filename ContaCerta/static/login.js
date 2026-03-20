const btnEl = document.querySelector('.btn-primary');
const cardEl = document.querySelector('.login-card');
const pEl = document.querySelector('.resul');

btnEl.addEventListener('click', () => {
    const nome = document.querySelector('.nome').value;
    const senha = document.querySelector('.senha').value;

    pEl.innerHTML = "";
    cardEl.classList.remove('shake');
    

    if(!nome || !senha) {
        pEl.innerHTML = "Preencha todos os campos.";
        cardEl.classList.add('shake');
        return;
    }


    btnEl.classList.add('loading');
    btnEl.disabled = true;

    const Pessoa = {
        "nome": nome,
        "senha": senha
    };

    fetch('/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(Pessoa)
    })
    .then(resp => resp.json())
    .then(data => {
        btnEl.classList.remove('loading');
        btnEl.disabled = false;

        if (data.status === "ok") {
            window.location.href = data.redirect;
        } else {

            pEl.innerHTML = `${data.message}`;
            

            void cardEl.offsetWidth; 
            cardEl.classList.add('shake');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        btnEl.classList.remove('loading');
        btnEl.disabled = false;
        pEl.innerHTML = "Erro de conexão. Tente novamente.";
    });
});


document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        btnEl.click();
    }
});
