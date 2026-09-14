if (Session.isLoggedIn()) {
  Session.redirectAfterLogin({ user: Session.getUser() });
}

const params = new URLSearchParams(location.search);
const redirect = params.get('redirect');

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await api.login({
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    });
    Session.save(res.data.token, res.data.user);
    if (redirect) window.location.href = redirect;
    else Session.redirectAfterLogin(res.data);
  } catch (err) {
    UI.showAlert('alert', err.message);
  }
});
