"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Recipe, RecipeUpdate } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { invalidateRecipesCache } from "@/lib/actions";

interface RecipeDetailProps {
  recipe: Recipe;
  signedImageUrl: string | null;
}

export default function RecipeDetail({
  recipe,
  signedImageUrl,
}: RecipeDetailProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cookingMode, setCookingMode] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [isPublic, setIsPublic] = useState(recipe.is_public);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleCookingMode = async () => {
    if (cookingMode && wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
      setCookingMode(false);
    } else {
      try {
        if ("wakeLock" in navigator) {
          const lock = await navigator.wakeLock.request("screen");
          setWakeLock(lock);
          setCookingMode(true);
          lock.addEventListener("release", () => {
            setCookingMode(false);
            setWakeLock(null);
          });
        }
      } catch (err) {
        console.error("Wake Lock error:", err);
      }
    }
  };
  const router = useRouter();
  const supabase = createClient();

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${recipe.slug}`
      : "";

  const togglePublic = async () => {
    setTogglingPublic(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { error } = await supabase
        .from("recipes")
        .update({ is_public: !isPublic } as unknown as never)
        .eq("id", recipe.id)
        .eq("user_id", user.id);

      if (error) throw error;
      setIsPublic(!isPublic);
    } catch (err) {
      console.error("Error toggling public:", err);
      alert("Er ging iets mis");
    } finally {
      setTogglingPublic(false);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying:", err);
    }
  };

  const handleDownloadImage = async () => {
    if (!signedImageUrl) return;
    try {
      const response = await fetch(signedImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = blob.type.split("/")[1] || "jpg";
      a.download = `${recipe.title}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      window.open(signedImageUrl, "_blank");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      if (recipe.image_path) {
        await supabase.storage
          .from("recipe-images")
          .remove([recipe.image_path]);
      }

      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id)
        .eq("user_id", user.id);

      if (error) throw error;

      await invalidateRecipesCache();
      router.push("/recipes");
    } catch (err) {
      console.error("Error deleting recipe:", err);
      alert("Er ging iets mis bij het verwijderen");
    } finally {
      setDeleting(false);
    }
  };

  const formattedDate = new Date(recipe.created_at).toLocaleDateString(
    "nl-NL",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const updatedDate = new Date(recipe.updated_at).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const ingredientLines = recipe.ingredients
    .split("\n")
    .filter((line) => line.trim());

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <Link
          href="/recipes"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors print:hidden"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Terug naar recepten
        </Link>

        <div className="card overflow-hidden print:shadow-none print:border-none">
          {/* Screen layout: image at top */}
          {signedImageUrl && (
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="relative aspect-video sm:aspect-[21/9] print:hidden w-full cursor-zoom-in group/img"
            >
              <Image
                src={signedImageUrl}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 768px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                <span className="bg-black/50 text-white rounded-full p-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </span>
              </div>
            </button>
          )}

          <div className="p-6 sm:p-8 print:p-0">
            {/* Header with title and buttons */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 print:text-2xl print:mb-1">
                  {recipe.title}
                </h1>
                <p className="text-sm text-gray-500 print:hidden">
                  Toegevoegd op {formattedDate}
                  {recipe.updated_at !== recipe.created_at && (
                    <> · Bijgewerkt op {updatedDate}</>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden self-end sm:self-auto">
                <button
                  onClick={toggleCookingMode}
                  className="lg:hidden flex items-center gap-2 text-sm text-gray-600"
                  title="Houd scherm aan"
                >
                  <span className="whitespace-nowrap">Scherm aan</span>
                  <span
                    className={`w-11 h-6 rounded-full transition-colors relative inline-block flex-shrink-0 ${cookingMode ? "bg-primary-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute w-5 h-5 bg-white rounded-full shadow top-0.5 transition-transform ${cookingMode ? "left-[22px]" : "left-0.5"}`}
                    />
                  </span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-secondary"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowShareModal(true);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                          Delen
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <Link
                          href={`/recipes/${recipe.slug}/edit`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Bewerken
                        </Link>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowDeleteModal(true);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Print layout */}
            <div className="hidden print:block">
              {/* Small image at top - use img tag for print compatibility */}
              {signedImageUrl && (
                <img
                  src={signedImageUrl}
                  alt={recipe.title}
                  className="w-full h-auto object-cover rounded mb-4"
                />
              )}

              {/* 2 columns: description left (2/3), ingredients right (1/3) */}
              <div className="flex gap-6">
                <div className="flex-[2]">
                  {recipe.description && (
                    <>
                      <h2 className="text-base font-semibold text-gray-900 mb-2">
                        Omschrijving
                      </h2>
                      <p className="text-gray-600 whitespace-pre-wrap text-sm">
                        {recipe.description}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex-1 border-l border-gray-200 pl-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-2">
                    Ingrediënten
                  </h2>
                  <ul className="text-sm space-y-1">
                    {ingredientLines.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Screen description (hidden on print) */}
            {recipe.description && (
              <div className="mb-8 print:hidden">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Omschrijving
                </h2>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {recipe.description}
                </p>
              </div>
            )}

            {/* Screen ingredients (hidden on print) */}
            <div className="print:hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Ingrediënten
              </h2>
              <ul className="space-y-2">
                {ingredientLines.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-primary-500 flex-shrink-0" />
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Source URL */}
            {recipe.source_url && (
              <div className="mt-8 pt-6 border-t border-gray-200 print:hidden">
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  <svg
                    className="w-4 h-4 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Bekijk origineel recept
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Recept verwijderen?
            </h3>
            <p className="text-gray-600 mb-6">
              Weet je zeker dat je &quot;{recipe.title}&quot; wilt verwijderen?
              Dit kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={deleting}
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
                disabled={deleting}
              >
                {deleting ? "Verwijderen..." : "Verwijderen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox modal */}
      {showImageModal && signedImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          {/* Top bar with actions */}
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <a
                href={signedImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm backdrop-blur-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Nieuw tabblad
              </a>
              <button
                onClick={handleDownloadImage}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm backdrop-blur-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
            <button
              onClick={() => setShowImageModal(false)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Full-size image */}
          <div
            className="relative w-full h-full flex items-center justify-center p-12 sm:p-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={signedImageUrl}
              alt={recipe.title}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recept delen
            </h3>

            <div className="mb-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-700">Publiek toegankelijk</span>
                <button
                  onClick={togglePublic}
                  disabled={togglingPublic}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isPublic ? "bg-primary-500" : "bg-gray-300"} ${togglingPublic ? "opacity-50" : ""}`}
                >
                  <span
                    className={`absolute w-5 h-5 bg-white rounded-full shadow top-0.5 transition-transform ${isPublic ? "left-[22px]" : "left-0.5"}`}
                  />
                </button>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                {isPublic
                  ? "Iedereen met de link kan dit recept bekijken"
                  : "Alleen jij kunt dit recept bekijken"}
              </p>
            </div>

            {isPublic && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deel link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="input flex-1 text-sm bg-gray-50"
                  />
                  <button
                    onClick={copyShareLink}
                    className="btn-secondary whitespace-nowrap"
                  >
                    {copied ? "Gekopieerd!" : "Kopieer"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="btn-secondary"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
