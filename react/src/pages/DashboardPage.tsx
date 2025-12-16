import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import DismissibleAlert from "@/react/design-system/dismissible-alert/DismissibleAlert";
import {
  clientDebug,
  clientError,
  clientWarn,
} from "@/react/utils/clientLogger";
import { getStoreApi, useAppStoreHydrated } from "@/react/zustand/useAppStore";
import {
  LANG_PATH_SEGMENT_INDEX,
  EMPTY_STRING,
  SIGNAL_ONE,
} from "@/shared/constants/http";
import { SupportedLanguage } from "@/shared/language/supported-languages";
import {
  dashboardPath,
  deleteAccountPath,
  songEditPath,
  songLibraryPath,
  butterchurnDemoPath,
} from "@/shared/paths";
import { justSignedInQueryParam } from "@/shared/queryParams";
import {
  justRegisteredKey,
  justSignedOutKey,
} from "@/shared/sessionStorageKeys";
import { type UserSessionData } from "@/shared/userSessionData";

type SongManagementSectionProps = Readonly<{
  t: (key: string, fallback: string) => string;
  navigate: (path: string, options?: { readonly replace?: boolean }) => void;
  currentLang: string;
}>;

function SongManagementSection({
  t,
  navigate,
  currentLang,
}: SongManagementSectionProps): ReactElement {
  return (
    <div className="mt-6 rounded-lg border border-gray-600 bg-gray-800 p-4">
      <h3 className="mb-3 text-lg font-semibold">
        {t("pages.dashboard.songManagement", "Song Management")}
      </h3>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-white transition-colors duration-150 hover:bg-blue-700"
          onClick={() => {
            navigate(`/${currentLang}/${dashboardPath}/${songEditPath}`);
          }}
        >
          {t("pages.dashboard.createSong", "Create New Song")}
        </button>
        <button
          type="button"
          className="rounded border border-blue-600 bg-transparent px-4 py-2 text-blue-600 transition-colors duration-150 hover:bg-blue-50/5"
          onClick={() => {
            navigate(`/${currentLang}/${dashboardPath}/${songLibraryPath}`);
          }}
        >
          {t("pages.dashboard.manageSongs", "Manage Songs")}
        </button>
        <button
          type="button"
          className="rounded border border-green-600 bg-transparent px-4 py-2 text-green-600 transition-colors duration-150 hover:bg-green-50/5"
          onClick={() => {
            navigate(`/${currentLang}/${dashboardPath}/${songLibraryPath}`);
          }}
        >
          {t("pages.dashboard.songLibrary", "Song Library")}
        </button>
      </div>
    </div>
  );
}

function VisualizationsSection({
  t,
  navigate,
  currentLang,
}: SongManagementSectionProps): ReactElement {
  return (
    <div className="mt-6 rounded-lg border border-gray-600 bg-gray-800 p-4">
      <h3 className="mb-3 text-lg font-semibold">
        {t("pages.dashboard.visualizations", "Visualizations")}
      </h3>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded border border-purple-600 bg-transparent px-4 py-2 text-purple-600 transition-colors duration-150 hover:bg-purple-50/5"
          onClick={() => {
            navigate(`/${currentLang}/${butterchurnDemoPath}`);
          }}
        >
          {t("navigation.butterchurn", "Butterchurn Visualizer")}
        </button>
      </div>
    </div>
  );
}

function DashboardPage(): ReactElement {
  // Disable react-i18next suspense here to avoid suspending during render.
  const { t } = useTranslation(undefined, { useSuspense: false });
  const navigate = useNavigate();

  // Use hydration-aware app store hook to get hydration state only.
  const { isHydrated } = useAppStoreHydrated();

  // Local component state mirrors the store via a subscription so we
  // avoid calling the bound store selector hooks directly (which were
  // triggering hook-order issues). We initialize from the store snapshot
  // if available.
  const snapshot = getStoreApi()?.getState();
  const [localIsSignedIn, setLocalIsSignedIn] = useState<boolean | undefined>(
    () => snapshot?.isSignedIn,
  );
  const [localUser, setLocalUser] = useState<UserSessionData | undefined>(
    () => snapshot?.userSessionData,
  );
  const signOutRef = useRef<() => void>(
    () => snapshot?.signOut ?? ((): undefined => undefined),
  );
  const [showSignedInAlert, setShowSignedInAlert] = useState<boolean>(false);
  const [showRegisteredAlert, setShowRegisteredAlert] =
    useState<boolean>(false);

  // showSignedInAlert comes directly from the zustand selector above.

  // (debug trace removed)
  // Derive current language from the path as a robust fallback
  const pathname =
    typeof globalThis === "undefined" ? "/" : globalThis.location.pathname;
  const maybeLang =
    pathname.split("/")[LANG_PATH_SEGMENT_INDEX] ?? EMPTY_STRING;
  const currentLang = maybeLang || SupportedLanguage.en;

  // Check sessionStorage for the one-time justSignedIn signal set by the
  // redirect flow. If present, show the alert and consume the key.
  useEffect(() => {
    if (typeof globalThis === "undefined") {
      return;
    }
    try {
      const justRegistered = sessionStorage.getItem(justRegisteredKey);
      const justSigned = sessionStorage.getItem(justSignedInQueryParam);
      if (justRegistered === SIGNAL_ONE) {
        clientWarn(
          "[DashboardPage] consumed justRegistered from sessionStorage",
        );
        queueMicrotask(() => {
          setShowRegisteredAlert(true);
        });
        sessionStorage.removeItem(justRegisteredKey);
      } else if (justSigned === SIGNAL_ONE) {
        clientWarn("[DashboardPage] consumed justSignedIn from sessionStorage");
        queueMicrotask(() => {
          setShowSignedInAlert(true);
        });
        sessionStorage.removeItem(justSignedInQueryParam);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  // Subscribe to store updates to keep local state in sync.
  useEffect(() => {
    const api = getStoreApi();
    if (!api) {
      return;
    }

    const unsubscribe = api.subscribe((state) => {
      setLocalIsSignedIn(state.isSignedIn);
      setLocalUser(state.userSessionData);
      signOutRef.current = state.signOut;
    });

    return (): void => {
      unsubscribe();
    };
  }, []);

  // If we haven't finished hydration, render a neutral placeholder to
  // ensure hook order remains stable and avoid hydration mismatches.
  if (!isHydrated) {
    return <div />;
  }

  if (localIsSignedIn === false) {
    return (
      <div className="text-center text-gray-300">
        <h2 className="text-2xl font-bold">
          {t("pages.dashboard.signedOutTitle")}
        </h2>
        <p className="mt-2">{t("pages.dashboard.signedOutBody")}</p>
      </div>
    );
  }

  return (
    <div>
      {/* One-time success alerts after signing in or registering */}
      <DismissibleAlert
        visible={Boolean(showSignedInAlert || showRegisteredAlert)}
        onDismiss={() => {
          setShowSignedInAlert(false);
          setShowRegisteredAlert(false);
        }}
        variant="success"
        alertType={
          showRegisteredAlert ? "registeredSuccess" : "signedInSuccess"
        }
      >
        {showRegisteredAlert
          ? t(
              "pages.dashboard.createdAccountSuccess",
              "You have successfully created an account.",
            )
          : t(
              "pages.dashboard.signedInSuccess",
              "You have successfully signed in.",
            )}
      </DismissibleAlert>

      <h2 className="mb-4 text-3xl font-bold">{t("pages.dashboard.title")}</h2>
      <p className="text-gray-300">
        {t("pages.dashboard.welcome", { name: localUser?.user?.name ?? "" })}
      </p>

      <SongManagementSection
        t={t}
        navigate={(path: string, options?: { readonly replace?: boolean }) => {
          void navigate(path, options);
        }}
        currentLang={currentLang}
      />

      <VisualizationsSection
        t={t}
        navigate={(path: string, options?: { readonly replace?: boolean }) => {
          void navigate(path, options);
        }}
        currentLang={currentLang}
      />

      <div className="mt-4">
        <button
          type="button"
          className="rounded bg-red-600 px-3 py-1 text-white"
          onClick={() => {
            void (async (): Promise<void> => {
              // Immediately clear client-side auth state so UI reflects
              // sign-out without waiting on network roundtrips. This
              // avoids the appearance of "nothing happened" when the
              // network is slow or the backend cookie take time to clear.
              try {
                // Perform client-side sign-out immediately.
                signOutRef.current();
              } catch (error) {
                clientError("signOut failed:", error);
              }

              // Attempt sign-out on the server to clear the HttpOnly cookie.
              try {
                const res = await fetch(`/api/auth/signout`, {
                  method: "POST",
                  credentials: "include",
                });
                clientDebug("/api/auth/signout status=", res.status);
              } catch (error) {
                clientError("Sign-out API failed:", error);
              }

              // Explicitly set client-side signed-out state after server call.
              try {
                const storeApi = getStoreApi();
                if (storeApi) {
                  storeApi.getState().setIsSignedIn(false);
                }
              } catch (error) {
                clientError("explicit setIsSignedIn(false) failed:", error);
              }
            })();

            // Soft navigate to localized root. Use sessionStorage-only
            // as a one-time signal for the home page alert.
            try {
              sessionStorage.setItem(justSignedOutKey, SIGNAL_ONE);
            } catch {
              /* ignore storage errors */
            }

            void navigate(`/${currentLang}`, {
              replace: true,
            });
          }}
        >
          {t("pages.dashboard.signOut")}
        </button>

        {/* Delete account navigates to a confirmation page */}
        <button
          type="button"
          className="ml-3 rounded border border-red-600 bg-transparent px-3 py-1 text-red-600 hover:bg-red-50/5"
          onClick={() => {
            void navigate(
              `/${currentLang}/${dashboardPath}/${deleteAccountPath}`,
            );
          }}
        >
          {t("pages.dashboard.deleteAccount", "Delete Account")}
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
