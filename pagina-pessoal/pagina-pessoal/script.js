const botao = document.getElementById("btnMensagem");
const mensagem = document.getElementById("mensagem");

botao.addEventListener("click", () => {
    mensagem.textContent = "Obrigado por visitar meu projeto!";
});
