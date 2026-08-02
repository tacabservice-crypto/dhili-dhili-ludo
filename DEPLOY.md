# Tilmaamaha Deployment-ka ee Render (Tallaabo-Tallaabo)

Kani waa hage faahfaahsan oo ku tusinaya sida aad app-kan online-ka ugu gelin karto adigoo isticmaalaya adeegga **Render.com**, kaas oo leh qorshe bilaash ah.

## Qaybta 1: Diyaarinta Koodhkaaga & GitHub

Kahor intaadan deploy-garayn, waa inaan hubinno in koodhkaagu uu ku jiro GitHub. Render wuxuu koodhka ka soo qaadan doonaa halkaas.

1.  **Hubi in Koodhkaagu uu GitHub ku jiro:**
    *   Haddii aanu koodhkaagu hore ugu jirin, samee repository cusub oo [GitHub.com](https://github.com/new) ah.
    *   Raac tilmaamaha GitHub si aad koodhkaaga oo dhan ugu `push`-garayso repository-gaas. Hubi in faylasha sida `package.json`, `server.ts`, iyo `vite.config.ts` ay ku jiraan.

2.  **Ha gelin `node_modules` ama `dist`:**
    *   Hubi in faylkaaga `.gitignore` uu ku qoran yahay `node_modules` iyo `dist`. Render ayaa si toos ah u samayn doona faylashaas.

## Qaybta 2: Dejinta Project-ka Render

Hadda waxaan u gudbaynaa website-ka Render si aan u abuurno adeegga (service) martigelin doona ciyaartaada.

1.  **Samee Account Render:**
    *   Aad dashboard.render.com.
    *   Guji **"Continue with GitHub"** si aad ugu xirto account-kaaga GitHub. Tani waxay sahlaysaa inuu koodhkaaga helo.

2.  **Samee Adeeg Cusub (New Web Service):**
    *   Markaad gasho dashboard-ka, guji badhanka **"New +"**.
    *   Ka dooro **"Web Service"**.

3.  **Ku xir Repository-gaaga GitHub:**
    *   Render wuxuu ku tusi doonaa liiska repository-yadaada GitHub.
    *   Raadi repository-ga ciyaartaada (tusaale, `dhili-dhili-ludo30`) oo guji **"Connect"** dhiniciisa.

4.  **Buuxi Faahfaahinta Adeegga:**
    Halkan waa meesha ugu muhiimsan. Si taxaddar leh u buuxi meelahan:

    *   **Name:** Sii magac aad ku garato project-kaaga (tusaale, `dhili-dhili-ludo`). Kani wuxuu noqon doonaa qayb ka mid ah link-gaaga.
    *   **Region:** Dooro meel kuu dhow (tusaale, **Frankfurt (EU Central)**).
    *   **Branch:** Hubi inuu yahay `main` (ama `master`, hadba kii aad isticmaasho).
    *   **Root Directory:** **ISKA DAA** (ha buuxin).
    *   **Runtime:** Render waa inuu si toos ah u doortaa **`Node`**. Haddii kale, adigu dooro.
    *   **Build Command:** Qor amarkan:
        ```bash
        npm install && npm run build
        ```
    *   **Start Command:** Qor amarkan:
        ```bash
        npm start
        ```
    *   **Instance Type:** Dooro **`Free`**.

5.  **Guji "Create Web Service":**
    *   Ha gujin weli! Hoos u soco si aan u habaynno Environment-ka.

## Qaybta 3: Habaynta Environment-ka iyo Sirta (Firebase)

Tani waa tallaabo aad muhiim u ah si app-kaagu ula xiriiro database-ka Firebase una shaqeeyo si sax ah.

1.  **Guji "Advanced Settings":**
    *   Intaadan abuurin adeegga, hoos u soco oo raadi qaybta **"Advanced"** oo fur.

2.  **Ku dar Environment Variables:**
    *   Guji **"Add Environment Variable"**.
    *   Samee variable-kan:
        *   **Key:** `NODE_ENV`
        *   **Value:** `production`

3.  **Ku dar Faylka Sirta ah ee Firebase (Secret File):**
    *   Tani waa tallaabada ugu muhiimsan haddii aad isticmaalayso Firebase.
    *   Guji **"Add Secret File"**.
    *   **Filename:** Qor `firebase-admin-key.json`
    *   **Contents:**
        1.  Fur faylkaaga `firebase-admin-key.json` ee kombiyuutarkaaga ku jira.
        2.  Koobiyee (Copy) dhammaan qoraalka ku dhex jira.
        3.  Ku dheji (Paste) sanduuqa **"Contents"** ee Render.

## Qaybta 4: Daah-furka (Deployment)

Hadda wax walba waa diyaar!

1.  **Guji "Create Web Service":**
    *   Hoos ugu soco bogga oo guji badhanka buluugga ah ee **"Create Web Service"**.

2.  **Sug Inta uu Dhismayo:**
    *   Render wuxuu bilaabi doonaa inuu koodhkaaga soo dejiyo, `npm install` sameeyo, `npm run build` sameeyo, kadibna `npm start` ku kiciyo.
    *   Waxaad arki doontaa log-ga (qoraalka shaqada) oo shaashadda ka muuqanaya. Sug ilaa aad ka aragto fariin u eg **"Your service is live 🎉"** ama **"Betting Ludo Game Full-Stack App listening at..."**.

3.  **Booqo App-kaaga:**
    *   Dusha sare ee bogga Render, waxaad arki doontaa link-ga app-kaaga oo u eg sidan: `https://dhili-dhili-ludo.onrender.com`.
    *   Guji link-gaas si aad u furto ciyaartaada!

Hambalyo! Hadda ciyaartaadu waxay ku jirtaa online-ka, waxaadna la wadaagi kartaa asxaabtaada. Markasta oo aad koodhkaaga GitHub-ka wax ka beddesho oo aad `push` garayso, Render si toos ah ayuu u cusboonaysiin doonaa app-kaaga.