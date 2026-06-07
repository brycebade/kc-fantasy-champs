const passwordSubmit = document.getElementById("passwordSubmit")
const adminDashboard = document.getElementById("adminDashboard")

passwordSubmit.addEventListener("click", () => {
    const inputValue = document.getElementById("passwordInput").value
    
    if (inputValue === "champs") {
        document.getElementById("passwordScreen").style.display = "none"
        adminDashboard.style.display = "block"
    } else {
       document.getElementById('errorMessage').textContent = "Incorrect Password"
    }
})