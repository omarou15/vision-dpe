/**
 * Routes Audit Énergétique — 20 étapes
 *
 * Étapes 1-11 : réutilisent les pages DPE (mutualisées)
 * Étapes 12-20 : pages spécifiques audit
 */

import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

// Pages DPE mutualisées (étapes 1-11)
const Step1Page = lazy(() => import("@/pages/wizard/Step1Page"));
const Step2Page = lazy(() => import("@/pages/wizard/Step2Page"));
const Step3Page = lazy(() => import("@/pages/wizard/Step3Page"));
const Step4Page = lazy(() => import("@/pages/wizard/Step4Page"));
const Step5Page = lazy(() => import("@/pages/wizard/Step5Page"));
const Step6Page = lazy(() => import("@/pages/wizard/Step6Page"));
const Step7Page = lazy(() => import("@/pages/wizard/Step7Page"));
const Step8Page = lazy(() => import("@/pages/wizard/Step8Page"));
const Step9Page = lazy(() => import("@/pages/wizard/Step9Page"));
const Step10Page = lazy(() => import("@/pages/wizard/Step10Page"));
const Step11Page = lazy(() => import("@/pages/wizard/Step11Page"));

// Pages Audit spécifiques (étapes 12-20)
const AuditStep12Page = lazy(() => import("@/pages/audit/AuditStep12Page"));
const AuditStep13Page = lazy(() => import("@/pages/audit/AuditStep13Page"));
const AuditStep14Page = lazy(() => import("@/pages/audit/AuditStep14Page"));
const AuditStep15Page = lazy(() => import("@/pages/audit/AuditStep15Page"));
const AuditStep16Page = lazy(() => import("@/pages/audit/AuditStep16Page"));
const AuditStep17Page = lazy(() => import("@/pages/audit/AuditStep17Page"));
const AuditStep18Page = lazy(() => import("@/pages/audit/AuditStep18Page"));
const AuditStep19Page = lazy(() => import("@/pages/audit/AuditStep19Page"));
const AuditStep20Page = lazy(() => import("@/pages/audit/AuditStep20Page"));

export const auditRoutes: RouteObject[] = [
  // Étapes mutualisées DPE (1-11)
  { path: "step/1", element: <Step1Page /> },
  { path: "step/2", element: <Step2Page /> },
  { path: "step/3", element: <Step3Page /> },
  { path: "step/4", element: <Step4Page /> },
  { path: "step/5", element: <Step5Page /> },
  { path: "step/6", element: <Step6Page /> },
  { path: "step/7", element: <Step7Page /> },
  { path: "step/8", element: <Step8Page /> },
  { path: "step/9", element: <Step9Page /> },
  { path: "step/10", element: <Step10Page /> },
  { path: "step/11", element: <Step11Page /> },

  // Étapes spécifiques audit (12-20)
  { path: "step/12", element: <AuditStep12Page /> },
  { path: "step/13", element: <AuditStep13Page /> },
  { path: "step/14", element: <AuditStep14Page /> },
  { path: "step/15", element: <AuditStep15Page /> },
  { path: "step/16", element: <AuditStep16Page /> },
  { path: "step/17", element: <AuditStep17Page /> },
  { path: "step/18", element: <AuditStep18Page /> },
  { path: "step/19", element: <AuditStep19Page /> },
  { path: "step/20", element: <AuditStep20Page /> },
];
