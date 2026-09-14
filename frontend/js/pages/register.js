document.getElementById('reg-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const res = await api.register({
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    });
    Session.save(res.data.token, res.data.user);
    Session.redirectAfterLogin(res.data);
  } catch (err) {
    UI.showAlert('alert', err.message);
  }
});
