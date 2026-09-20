# API-Endpunkte und Server-Actions — EH-02

Stand: 2026-09-20. Kanonisches Inventar aus src/app.

## Client → Server-Verträge

- GET /api/ki ← AiSettings.load/useEffect
- POST /api/ki ← KiChatPage.sendWith
- GET /api/ai/byok ← AiSettings.load/useEffect
- POST /api/ai/byok ← AiSettings.saveKey/disableKey
- POST /api/ai/credits ← AiSettings.watchAd
- GET /api/account/export ← AccountActions.exportData
- POST /api/konto-loeschen ← AccountActions.deleteAccount
- POST /api/telemetry ← CwvTelemetry
- POST /api/errors ← ErrorPage
- POST+PATCH /api/owner/messages/[contactUserId] ← OwnerMessageComposer
- POST+PATCH /api/support/messages/[homeownerId] ← ProviderMessageComposer

## Route Handler (27)

- GET `/api/account/export` — `src/app/api/account/export/route.ts`
- GET `/api/admin/verification-file/[id]` — `src/app/api/admin/verification-file/[id]/route.ts`
- GET `/api/affiliate/[category]` — `src/app/api/affiliate/[category]/route.ts`
- POST/GET `/api/ai/byok` — `src/app/api/ai/byok/route.ts`
- POST `/api/ai/credits` — `src/app/api/ai/credits/route.ts`
- POST `/api/auth/local-login` — `src/app/api/auth/local-login/route.ts`
- GET `/api/documents/[id]` — `src/app/api/documents/[id]/route.ts`
- POST `/api/errors` — `src/app/api/errors/route.ts`
- GET `/api/health` — `src/app/api/health/route.ts`
- POST `/api/hooks/neue-anfrage` — `src/app/api/hooks/neue-anfrage/route.ts`
- POST `/api/hooks/neues-angebot` — `src/app/api/hooks/neues-angebot/route.ts`
- GET `/api/house-contracts/[id]/document` — `src/app/api/house-contracts/[id]/document/route.ts`
- GET `/api/house-history-documents/[id]` — `src/app/api/house-history-documents/[id]/route.ts`
- GET `/api/house-history-files/[id]/[kind]` — `src/app/api/house-history-files/[id]/[kind]/route.ts`
- GET `/api/job-media/[id]` — `src/app/api/job-media/[id]/route.ts`
- POST/GET/PUT `/api/ki` — `src/app/api/ki/route.ts`
- POST `/api/konto-loeschen` — `src/app/api/konto-loeschen/route.ts`
- GET `/api/live` — `src/app/api/live/route.ts`
- POST/PATCH `/api/owner/messages/[contactUserId]` — `src/app/api/owner/messages/[contactUserId]/route.ts`
- GET `/api/partner-memberships/success` — `src/app/api/partner-memberships/success/route.ts`
- GET `/api/payments/success` — `src/app/api/payments/success/route.ts`
- GET `/api/stripe/connect/refresh` — `src/app/api/stripe/connect/refresh/route.ts`
- GET `/api/stripe/connect/return` — `src/app/api/stripe/connect/return/route.ts`
- POST `/api/stripe/webhook` — `src/app/api/stripe/webhook/route.ts`
- POST/PATCH `/api/support/messages/[homeownerId]` — `src/app/api/support/messages/[homeownerId]/route.ts`
- POST `/api/telemetry` — `src/app/api/telemetry/route.ts`
- GET/POST `/api/whatsapp/webhook` — `src/app/api/whatsapp/webhook/route.ts`

## Server Actions (79)

- `registerAction` — `src/app/actions.ts`
- `loginAction` — `src/app/actions.ts`
- `logoutAction` — `src/app/actions.ts`
- `sendHausmeisterAction` — `src/app/actions.ts`
- `createConsultationAction` — `src/app/actions.ts`
- `createEmergencyAction` — `src/app/actions.ts`
- `startHausmeisterRouteAction` — `src/app/actions.ts`
- `createJobAction` — `src/app/actions.ts`
- `turnContactIntoServiceAction` — `src/app/actions.ts`
- `acceptContactRequestAction` — `src/app/actions.ts`
- `submitQuoteAction` — `src/app/actions.ts`
- `acceptQuoteAction` — `src/app/actions.ts`
- `sendMessageAction` — `src/app/actions.ts`
- `markInProgressAction` — `src/app/actions.ts`
- `markCompleteAction` — `src/app/actions.ts`
- `cancelJobAction` — `src/app/actions.ts`
- `createCheckoutAction` — `src/app/actions.ts`
- `createInvoiceAction` — `src/app/actions.ts`
- `cancelInvoiceAction` — `src/app/actions.ts`
- `createInvoiceCheckoutAction` — `src/app/actions.ts`
- `reviewAction` — `src/app/actions.ts`
- `toggleFeatureFlagAction` — `src/app/actions.ts`
- `reportReviewAction` — `src/app/actions.ts`
- `requeueDeadNotificationAction` — `src/app/actions.ts`
- `moderateReviewAction` — `src/app/actions.ts`
- `saveProfileAction` — `src/app/actions.ts`
- `uploadDocumentAction` — `src/app/actions.ts`
- `addHouseHistoryAction` — `src/app/actions.ts`
- `createHouseTransferAction` — `src/app/actions.ts`
- `acceptHouseTransferAction` — `src/app/actions.ts`
- `savePropertyValuationAction` — `src/app/actions.ts`
- `startSaleProcessAction` — `src/app/actions.ts`
- `grantBrokerContactAction` — `src/app/actions.ts`
- `revokeBrokerContactAction` — `src/app/actions.ts`
- `updateBrokerLeadStatusAction` — `src/app/actions.ts`
- `adminLoginAction` — `src/app/actions.ts`
- `adminLogoutAction` — `src/app/actions.ts`
- `submitVerificationAction` — `src/app/actions.ts`
- `adminReviewVerificationAction` — `src/app/actions.ts`
- `createInsuranceSupportAction` — `src/app/actions.ts`
- `createClaimAction` — `src/app/actions.ts`
- `adminUpdateClaimAction` — `src/app/actions.ts`
- `createStripeOnboardingAction` — `src/app/actions.ts`
- `markNotificationsReadAction` — `src/app/actions.ts`
- `declineDispatchAction` — `src/app/actions.ts`
- `adminUpdatePartnerContractAction` — `src/app/actions.ts`
- `addProviderMemberAction` — `src/app/actions.ts`
- `updateProviderMemberAction` — `src/app/actions.ts`
- `assignJobContactAction` — `src/app/actions.ts`
- `updateAutomationPrefsAction` — `src/app/actions.ts`
- `updateContactCategoryAction` — `src/app/actions.ts`
- `sendSavedContactMessageAction` — `src/app/actions.ts`
- `startPartnerPlanCheckoutAction` — `src/app/actions.ts`
- `saveHouseProfileAction` — `src/app/actions.ts`
- `addHouseAssetAction` — `src/app/actions.ts`
- `completeMaintenanceTaskAction` — `src/app/actions.ts`
- `addHouseContractAction` — `src/app/actions.ts`
- `updateHouseContractAction` — `src/app/actions.ts`
- `setHouseContractStatusAction` — `src/app/actions.ts`
- `adminReviewVerificationLifecycleAction` — `src/app/admin/actions.ts`
- `adminUpdatePartnerContractLifecycleAction` — `src/app/admin/actions.ts`
- `addCrmLeadAction` — `src/app/admin/crm/actions.ts`
- `updateCrmLeadAction` — `src/app/admin/crm/actions.ts`
- `syncBusinessResearchAction` — `src/app/admin/crm/actions.ts`
- `requestPropertyValuationAction` — `src/app/app/home/sale/actions.ts`
- `storeExistingValuationAction` — `src/app/app/home/sale/actions.ts`
- `approveBrokerShareAction` — `src/app/app/home/sale/actions.ts`
- `revokeBrokerShareAction` — `src/app/app/home/sale/actions.ts`
- `submitDirectoryAction` — `src/app/app/messages/directory-actions.ts`
- `submitDirectoryShortcut` — `src/app/app/messages/directory-actions.ts`
- `loadOnboardingState` — `src/app/app/onboarding/actions.ts`
- `saveOnboardingProfileAction` — `src/app/app/onboarding/actions.ts`
- `saveOnboardingInterestsAction` — `src/app/app/onboarding/actions.ts`
- `saveOnboardingContactAction` — `src/app/app/onboarding/actions.ts`
- `setNotificationReadStateAction` — `src/app/notifications/actions.ts`
- `markAllNotificationsReadForCurrentUserAction` — `src/app/notifications/actions.ts`
- `saveWizardStepAction` — `src/app/pro/onboarding/actions.ts`
- `saveProviderProfileLifecycleAction` — `src/app/pro/profile/actions.ts`
- `submitProviderVerificationAction` — `src/app/pro/profile/actions.ts`

## EH-02 Gate

- Client-Verträge werden durch `scripts/eh02-api-contract-regression.mjs` geprüft.
- TODO/FIXME/STUB-Kommentare bzw. echte not-implemented-Throws im TypeScript-Quellbaum sind im Gate verboten.
- Build muss grün sein.
