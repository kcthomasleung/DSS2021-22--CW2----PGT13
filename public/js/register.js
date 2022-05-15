function validate_password() {

    const password = document.getElementById('password').value;
    const password_confirm = document.getElementById('password_confirm').value;

    // check if passwords match
    if (password != password_confirm) {
        document.getElementById('incorrect_password').style.color = 'red';
        document.getElementById('incorrect_password').innerHTML = 'Please enter the same password';
        document.getElementById('submit_button').disabled = true;
        document.getElementById('submit_button').style.opacity = (0.4);
    } else {
        document.getElementById('incorrect_password').style.color = 'green';
        document.getElementById('incorrect_password').innerHTML =
            'Password matched';
        document.getElementById('submit_button').disabled = false;
        document.getElementById('submit_button').style.opacity = (1);
    }
}

document.getElementById('password_confirm').addEventListener('keyup', validate_password);


const button = document.getElementById('search');
button.addEventListener('keyup', function(e) {
    console.log('button was clicked');

    fetch('/clicked', { method: 'POST' })
        .then(function(response) {
            if (response.ok) {
                console.log('Click was recorded');
                return;
            }
            throw new Error('Request failed.');
        })
        .catch(function(error) {
            console.log(error);
        });
});