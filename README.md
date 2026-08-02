<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>
# Dhili-Dhili Ludo Game

Kani waa mashruuc Ludo game ah oo leh real-time multiplayer, matchmaking, wallet system, iyo in ka badan. Waxaa lagu dhisay Node.js, Express, TypeScript, iyo Vite.

## Sida Loo Isticmaalo (Run Locally)

**Waxyaabaha Lagaa Rabo:**
*   Node.js (version 16 ama ka sareeya)
*   Maareeyaha package-ka ee `npm`

### Tallaabooyinka:

1.  **Soo deji dependencies-ka:**
    ```bash
    npm install
    ```

2.  **Habee Firebase (Optional):**
    Haddii aad rabto inaad isticmaasho Firebase Firestore si aad u kaydiso xogta, raac tillaabooyinkan:
    *   Samee project cusub Firebase Console.
    *   Aad **Project settings** > **Service accounts**.
    *   Guji **Generate new private key** si aad u soo dejiso faylka `JSON`.
    *   Faylkaas u bixi `firebase-admin-key.json` oo geli xididka (root) project-gaaga.
    *   Server-ku si toos ah ayuu u aqoonsan doonaa faylka marka uu kaco. Haddii faylkaas la waayo, wuxuu isticmaali doonaa kaydinta maxalliga ah (`db_store.json`).

3.  **Kici server-ka horumarinta (development server):**
    ```bash
    npm run dev
    ```
    App-ka wuxuu ka shaqayn doonaa `http://localhost:3002`.

## Sida Loo Deploy-gareeyo (Deploying to Production)

Si aad app-kan online-ka u geliso, waxaad u baahan tahay inaad ku martigeliso (host) meel sida Render, Heroku, DigitalOcean, ama server kale oo taageera Node.js.

### Tallaabooyinka Guud ee Deployment:

1.  **Build-garee project-ga:**
    Amarkan wuxuu isku darayaa faylasha frontend-ka (Vite) iyo backend-ka (TypeScript) wuxuuna gelinayaa `dist` folder.
    ```bash
    npm run build
    ```

2.  **U gudbi faylasha server-kaaga:**
    U gudbi dhammaan project-ga (ama ugu yaraan `dist` folder, `node_modules`, iyo `package.json`) server-kaaga.

3.  **Habee Environment Variables:**
    Server-kaaga, deji environment variable-kan:
    *   `NODE_ENV=production`

    Sidoo kale, hubi in faylkaaga `firebase-admin-key.json` uu yaallo meesha saxda ah ee server-kaaga si uu ula xiriiro database-kaaga.

4.  **Kici server-ka production-ka:**
    Markaad server-ka saaran tahay, isticmaal amarkan si aad u kiciso app-ka. Wuxuu isticmaalayaa faylasha la build-gareeyay ee ku jira `dist` folder.
    ```bash
    npm start
    ```

App-kaagu hadda waa inuu online ka ahaadaa ciwaanka server-kaaga.
