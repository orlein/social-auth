# Social Auth

## Google Auth

### Setup Flow

#### Google Developer Console
1. Go to [Google Developer Console](https://console.developers.google.com/)
2. Create a new project and go API & Services > Credentials
3. Create a new OAuth 2.0 Client ID
4. Add Authorized redirect URIs
5. Copy the Client ID and Client Secret

#### Backend (nest.js)
1. Add Client ID and Client Secret to the .env file
2. Add a service for Google Auth 
3. Add a method to return the Google Auth URL (`getGoogleAuthURL`)
4. Add a method to exchange the code
5. Connect the Google Auth service to the Auth Controller
6. (IMPORTANT) Add a controller route to handle the callback for the webapp
7. (IMPORTANT) Add a controller route to handle the callback for the mobile app

#### Frontend (next.js)
1. Add a button to trigger the Google Auth
2. Add a method to open the Google Auth URL

#### Frontend (React Native)
1. Install `@react-native-google-signin/google-signin`
2. Follow the setup guide
3. Add a button to trigger the Google Auth



### Auth Flow (Next.js)
1. User clicks on the Google Auth button
2. User is redirected to the Google Auth URL by the Backend
3. User logs in and gives permission in the Google Auth page
4. User is redirected back to the backend with a code by Google Auth 
     * (the redirect URI is set in the Google Developer Console; the code is sent as a query parameter; the code is used to exchange for the access token)
5. The backend receives the code and exchanges it for the own access token
6. The backend redirects the user **to the frontend server (next.js)** with the access token as a query parameter
7. The frontend server (next.js) receives the access token and stores it in the cookie
8. The user is redirected to the home page if needed

After all, the user is authenticated and the access token is stored in the cookie. The access token can be used to make requests to the backend server (nest.js) to access protected resources.


### Auth Flow (Mobile like React Native)
1. User clicks on the Google Auth button
2. User is redirected to the Google Auth URL by the Backend
3. User logs in and gives permission in the Google Auth page
4. User is redirected back to the backend with a code by Google Auth 
     * (the redirect URI is set in the Google Developer Console; the code is sent as a query parameter; the code is used to exchange for the access token)
5. The backend receives the code and exchanges it for the own access token
6. The backend sends the access token back to the mobile app
7. The mobile app receives the access token and stores it in the AsyncStorage or somewhere else
8. The user is redirected to the home page if needed