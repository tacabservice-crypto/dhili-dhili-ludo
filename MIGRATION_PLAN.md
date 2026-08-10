# Qorshaha Ka Guuritaanka Firebase Loona Guurayo MySQL

Dukumeentigan wuxuu qeexayaa tillaabooyinka loo baahan yahay si looga guuro barnaamijka keydka xogta ee Firebase/Firestore loona wareejiyo keydka xogta MySQL ee aad adigu martigelisay.

## Wajiga 1: Diyaarinta iyo Isku Xirka
1.  **Rakibida Barnaamijyada Ku Tiirsan:** Ku rakib baakadda `mysql2` si awood loogu siiyo Node.js inuu ku xirmo keydka xogta MySQL.
2.  **Macluumaadka Deegaanka (.env):** Ku dar faahfaahinta isku xirka MySQL (hostname, user, password, magaca keydka xogta) feylka `.env` si loo sugo qaabeynta.
3.  **Samee Isku Xir:** Samee cutub cusub oo maareeya macquulnimada isku xirka keydka xogta adoo isticmaalaya aqoonsiyada ka yimid feylka `.env`.
4.  **Tijaabada Isku Xirka:** Hirgeli tijaabo fudud (tusaale, API endpoint cusub ama qoraal bilow ah) si loo xaqiijiyo in server-ku si guul leh ugu xirmi karo keydka xogta Hostinger MySQL.

## Wajiga 2: Naqshadeynta Qaab-dhismeedka Keydka Xogta
1.  **Falanqee Qaab-dhismeedka Xogta:** Dib u eeg qaab-dhismeedka xogta Firestore ee hadda jira iyo astaamaha barnaamijka si loo aqoonsado dhammaan moodooyinka xogta ee lagama maarmaanka ah (tusaale, Isticmaalayaasha, Ciyaaraha, Wakiilada, Lacagaha).
2.  **Qeex Qaab-dhismeedka SQL:** Qor bayaannada `CREATE TABLE` ee moodel kasta, adoo qeexaya tiirarka, noocyada xogta, furayaasha aasaasiga ah, iyo xiriirka.
3.  **Fulinta Qaab-dhismeedka:** Ku dabaq qaab-dhismeedka keydka xogta MySQL ee fog si loo abuuro miisaska lagama maarmaanka ah.

## Wajiga 3: Dib-u-habeynta Lakabka Helitaanka Xogta (DAL)
1.  **Aqoonso Isticmaalka Firebase:** Soo hel dhammaan koodhka hadda la falgala Firestore (ugu horreyn `server.ts` iyo `src/firebase.ts`).
2.  **Abuur Weydiimaha MySQL:** Samee hawlo taxane ah oo qabta hawlgallada CRUD (Abuur, Akhri, Cusbooneysii, Tirtir) miisaska cusub ee MySQL. Tani waxay beddeli doontaa wicitaannadii hore ee Firestore.
3.  **Kala Saar Macquulnimada:** Ka saar isdhexgalka keydka xogta lakab gaar ah oo helitaanka xogta si loo ilaaliyo nadaafadda macquulnimada API endpoint.

## Wajiga 4: Ka Guuritaanka API Endpoint (La dhameystiray)
-  **Dib u eeg Endpoint-yada:** Mid mid u mar dhammaan API endpoint-yada lagu qeexay `server.ts`.
-  **Beddel Macquulnimada:** Si habaysan u beddel wicitaannada shaqo ee Firebase ee ku jira endpoint kasta adoo ku beddelaya wicitaannada hawlaha cusub ee MySQL DAL.
- **Tijaabi Endpoint-yada:** Ka dib markaad guurto endpoint kasta, si gaar ah u tijaabi si aad u hubiso inuu si sax ah ula shaqeynayo keydka xogta cusub.

## Wajiga 5: Tijaabinta iyo Ansixinta
1.  **Tijaabo Dhamaystiran:** Samee tijaabooyin dhamaystiran oo barnaamijka oo dhan ah si loo hubiyo in dhammaan astaamuhu u shaqeeyaan sidii la filayay.
2.  **Hagaaji Dhibaatooyinka:** Baar oo xalli wixii dhibaatooyin ah ee ka dhasha beddelka keydka xogta.

## Wajiga 6: Nadiifinta
1.  **Ka saar Ku Tiirsanaanta Firebase:** Marka guuritaanku noqdo mid deggan oo si buuxda loo ansixiyo, ka saar baakadaha Firebase `package.json`.
2.  **Tirtir Koodhkii Hore:** Ka saar feylasha qaabeynta Firebase ee duugoobay (`firebase.json`, `firestore.rules`) iyo koodhka aan shaqaynayn ee la xiriira isdhexgalka Firebase.
