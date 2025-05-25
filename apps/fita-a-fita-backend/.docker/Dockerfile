FROM node:lts AS runtime
WORKDIR /app

COPY . .
RUN rm -rf .env
RUN touch .env
RUN echo "NODE_ENV=production" >> .env
RUN echo "DATABASE=mongodb://<USER>:<PASSWORD>@mongodb:27017/fita-a-fita?retryWrites=true&w=majority" >> .env
RUN echo "DATABASE_PASSWORD=admin" >> .env
RUN echo "DATABASE_USER=admin" >> .env
RUN echo "JWT_SECRET=fita-a-fita-ultra-secret-encpass-try" >> .env
RUN echo "JWT_EXPIRES_IN=90d" >> .env
RUN echo "EMAIL_USERNAME=8576d345ce6c8d" >> .env
RUN echo "EMAIL_PASSWORD=55099f2db741ca" >> .env
RUN echo "EMAIL_HOST=3.86.141.192" >> .env
RUN echo "EMAIL_PORT=2525" >> .env
RUN echo "JWT_COOKIE_EXPIRES_IN=90" >> .env
RUN echo "PRIVATE_STRIPE_KEY=sk_test_51OZXApHXpzPsRpgciGnhWT2C45jHPkVahtySoXYPnYg1itwUuThEura2mllFZlcUPKOkD55fSzfm2tpsT8CCW32M00J4SnhmPX" >> .env

RUN npm install

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000 
CMD npm run start:dev && npm run import:data
