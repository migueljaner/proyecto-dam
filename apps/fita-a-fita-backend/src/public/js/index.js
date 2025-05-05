/* eslint-disable */
import { login, logout, signup } from './login';
import { displayMap } from './leaflet';
import { updateSettings } from './updatesettings';
import { bookTour } from './stripe';

const leaflet = document.getElementById('map');
const logoutBtn = document.querySelector('.nav__el--logout');
const loginForm = document.querySelector('.form.login-form');
const signupForm = document.querySelector('.form.signup-form');
const userDataFrom = document.querySelector('.form-user-data');
const userSettingsFrom = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');

if (leaflet) {
    const locations = JSON.parse(document.getElementById('map').dataset.locations);
    displayMap(locations);
}

if (loginForm)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(loginForm);

        const email = formData.get('email');
        const password = formData.get('password');

        await login(email, password);
    });

if (signupForm)
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(signupForm);
        formData.append('role', 'user');
        const formDataObj = Object.fromEntries(formData.entries());

        await signup(formDataObj);
    });

if (userDataFrom)
    userDataFrom.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(userDataFrom);
        const formDataObj = Object.fromEntries(formData.entries());

        await updateSettings(formDataObj, 'data');
    });

if (userSettingsFrom)
    userSettingsFrom.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(userSettingsFrom);
        const formDataObj = Object.fromEntries(formData.entries());

        await updateSettings(formDataObj, 'password');
    });

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (bookBtn)
    bookBtn.addEventListener('click', async (e) => {
        e.target.textContent = 'Processing...';

        const { tourId } = e.target.dataset;
        await bookTour(tourId);
    });
