document.addEventListener('DOMContentLoaded', () => {
    
    // Função para animar os números (Count Up)
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // Quanto menor, mais rápido

    counters.forEach(counter => {
        const updateCount = () => {
            // Pega o valor alvo definido no HTML (data-target)
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText.replace('.', ''); // Remove pontos se houver para calculo

            // Define o incremento
            const inc = target / speed;

            if (count < target) {
                // Formata o número com ponto (ex: 25.000)
                counter.innerText = Math.ceil(count + inc).toLocaleString('pt-AO');
                setTimeout(updateCount, 15);
            } else {
                counter.innerText = target.toLocaleString('pt-AO');
            }
        };

        updateCount();
    });

    // Interatividade simples do Menu (apenas visual para demo)
    const navItems = document.querySelectorAll('.nav-item:not(.logout)');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Remove active de todos
            navItems.forEach(nav => nav.classList.remove('active'));
            // Adiciona ao clicado
            item.classList.add('active');
        });
    });
});
