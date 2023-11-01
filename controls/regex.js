const validarFormatoEmail = (email) => {
    // Expresión regular para validar el formato de correo electrónico
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    // Utiliza el método test para verificar si el email coincide con la expresión regular
    return regex.test(email);
}

export default validarFormatoEmail;