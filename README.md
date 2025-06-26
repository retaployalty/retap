# ReTap Monorepo

## Deploy e Hosting

Il progetto è suddiviso in due app principali, ognuna con il proprio progetto su Vercel e dominio:

- **Website (Next.js):** https://retapcard.com  
  Progetto Vercel: `retap`
- **Flutter Web App:** https://app.retapcard.com  
  Progetto Vercel: `retapcard`

### Deploy

Per effettuare il deploy di entrambi i progetti:

```sh
./deploy.sh
```

Per deployare solo la Flutter Web App:

```sh
./deploy-flutter-app.sh
```

### Configurazione domini

- `retapcard.com` deve puntare al progetto Vercel `retap` (website)
- `app.retapcard.com` deve puntare al progetto Vercel `retapcard` (Flutter)

Configura i DNS del tuo provider aggiungendo:
- Un record **A** o **CNAME** per `retapcard.com` come indicato da Vercel
- Un record **CNAME** per `app.retapcard.com` che punti a `cname.vercel-dns.com`

### Routing

- Tutte le rotte `/c/:cardId` su `retapcard.com` vengono automaticamente reindirizzate a `app.retapcard.com/:cardId`.
- La Flutter Web App gestisce direttamente gli URL con l'ID della card.

### Note

- Per modifiche al database, aggiungi sempre una migration in `infra/supabase/migrations`.
- Per problemi di deploy, controlla la dashboard Vercel e i log di build.

---

Per domande o problemi, contatta @albertoravasini
