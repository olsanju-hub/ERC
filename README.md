# ERC

CDSS mobile first para apoyo a la decisión clínica en enfermedad renal crónica en Atención Primaria.

## Estado clínico

Auditoría local previa a repositorio: validada contra la bibliografía local disponible y pendiente de revisión médica final.

El cálculo automático de eGFR CKD-EPI 2021 creatinina está implementado con la ecuación local `Implementation-of-2021-CKD-EPI-Equations -8 Dec-21.pdf`. La entrada manual de FGe/eGFR se mantiene como override cuando el dato de laboratorio esté disponible.

Elementos clínicos revisados:

- Cálculo eGFR CKD-EPI 2021 creatinina.
- Clasificación G y A.
- Matriz de riesgo KDIGO.
- Criterios de ERC con FGe, albuminuria y hematuria/sedimento.
- Criterios de derivación a Nefrología.
- Recomendaciones de manejo AP, iSGLT2, IECA/ARA-II, presión arterial y potasio.

No se incluyen dosis farmacológicas ni sustitución del juicio clínico. El IMC automático se retiró de la app porque no formaba parte de la decisión clínica validada en esta versión.

## Stack

- React
- Vite
- Lucide React
- Playwright para verificación local

## Uso local

```bash
npm install
npm run dev
```

## Validación

```bash
npm run lint
npm run build
```

Verificación local realizada:

- `npm run lint`: OK.
- `npm run build`: OK.
- Playwright móvil 320, 375, 390 y 430 px: OK.
- Casos del apéndice CKD-EPI 2021: OK.

## Bibliografía local revisada

- `../ERC/Kdigo.pdf`
- `../ERC/EAC_2026_EnfermedadRenalCronica.pdf`
- `../ERC/Implementation-of-2021-CKD-EPI-Equations -8 Dec-21.pdf`
- `../ERC/dc26s011.pdf`
- `../ERC/ERC2.pdf`

## Advertencia clínica

Esta aplicación es una herramienta de apoyo a la decisión clínica. No sustituye el juicio clínico, la valoración individual del paciente, los protocolos locales ni la revisión por profesionales responsables.
