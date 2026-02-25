# Backend - Diário do Sorriso Especial

API Node.js para cadastro de pacientes, registro de rotina e geração de relatórios para acompanhamento odontológico.

## Como rodar

```bash
cd backend
npm install
npm run dev
```

Servidor padrão: `http://localhost:3333`

## Deploy (Vercel)

O projeto inclui `vercel.json` e `api/index.ts` para deploy do backend na Vercel.

1. Suba o repositório para GitHub.
2. Na Vercel, clique em **Add New...** → **Project** e importe o repositório.
3. Defina o **Root Directory** como `backend`.
4. Faça o deploy e copie a URL pública (ex.: `https://diario-sorriso-backend.vercel.app`).

### Persistência de dados

- O backend usa arquivo JSON local.
- Na Vercel, o filesystem é efêmero; os dados podem ser perdidos entre execuções.
- Para testes, você pode usar `DB_FILE_PATH=/tmp/db.json`.
- Para produção, o ideal é migrar para banco externo (Postgres, Neon, Supabase, etc.).

### Conectar o app mobile ao backend hospedado

No projeto Expo (`meu-app`), configure o `.env` com a URL pública do backend:

```dotenv
EXPO_PUBLIC_API_URL=https://SEU-BACKEND.vercel.app
```

Depois reinicie o Expo para recarregar variáveis de ambiente.

Exemplo:

```dotenv
EXPO_PUBLIC_API_URL=https://diario-sorriso-backend.vercel.app
```

## Rotas principais

- `GET /health`
- `POST /patients`
- `GET /patients`
- `GET /patients/:id`
- `POST /patients/:id/records`
- `GET /patients/:id/records` (geral)
- `GET /patients/:id/records?date=AAAA-MM-DD` (diário)
- `GET /reports/:patientId` (relatório geral)
- `GET /reports/:patientId?date=AAAA-MM-DD` (relatório diário)

## Exemplo de cadastro de paciente

```bash
curl -X POST http://localhost:3333/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lia",
    "sex": "feminino",
    "motherName": "Carla",
    "birthDate": "2019-05-10",
    "notes": "Prefere ambiente silencioso"
  }'
```

## Exemplo de registro diário

```bash
curl -X POST http://localhost:3333/patients/SEU_ID/records \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-24",
    "brushed": true,
    "fear": false,
    "sleptWell": true,
    "ateTooMuchCandy": false,
    "mood": "bom",
    "triggers": ["barulho", "luz"],
    "odontogram": [
      {
        "toothNumber": 11,
        "hasCaries": true,
        "hasTooth": true,
        "hasPain": false,
        "sensitivity": "leve",
        "notes": "Mancha inicial"
      }
    ],
    "photoDataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
  }'
```

`photoDataUrl` é opcional e deve estar em formato data URL de imagem (`data:image/...;base64,...`).
`odontogram` também é opcional e aceita dentes de `1` a `32`.

## Relatório do paciente

```bash
curl http://localhost:3333/reports/SEU_ID
```

## Histórico diário por data

```bash
curl "http://localhost:3333/patients/SEU_ID/records?date=2026-02-24"
```

## Relatório diário por data

```bash
curl "http://localhost:3333/reports/SEU_ID?date=2026-02-24"
```
