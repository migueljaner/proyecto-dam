/* eslint-disable */
import axios from 'axios';

const stripe = Stripe(
    'pk_test_51OZXApHXpzPsRpgcoIIse8LIXDpKTYGUN1OlLflYyCLWXrdrT35nfIvLcVBJSFR6DCGkm0xITvlC8nYbn7ulugCg002Rza028g',
);

export const bookTour = async (tourId) => {
    try {
        // 1) Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id,
        });
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};
