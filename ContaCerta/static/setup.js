const bntEl = document.querySelector('.btn-primary');
const cardEl = document.querySelector('.setup-card');
const pEl = document.querySelector('.resul');

bntEl.addEventListener('click', () => {
    const nome = document.querySelector('.nome').value.trim();
    const email = document.querySelector('.email').value.trim();
    const senha = document.querySelector('.senha').value;

    pEl.innerHTML = "";
    cardEl.classList.remove('shake');

    if (!nome || !email || !senha) {
        pEl.innerHTML = "Por favor, preencha todos os campos.";
        
        void cardEl.offsetWidth; 
        cardEl.classList.add('shake');
        return; 
    }

    if (!email.includes('@')) {
        pEl.innerHTML = "Insira um e-mail válido.";
        cardEl.classList.add('shake');
        return;
    }

    bntEl.classList.add('loading');
    bntEl.disabled = true;


    const Admin = {
        'nome': nome,
        'email': email,
        'senha': senha
    };

    fetch('/auth/setup', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(Admin)
    })
    .then(resp => resp.json())
    .then(data => {
        bntEl.classList.remove('loading');
        bntEl.disabled = false;

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
        bntEl.classList.remove('loading');
        bntEl.disabled = false;
        pEl.innerHTML = "Erro ao conectar com o servidor.";
    });
});


document.querySelector('.senha').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        bntEl.click();
    }
});
