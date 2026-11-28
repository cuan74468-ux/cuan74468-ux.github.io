# Pustaka Digital — deployment checklist

Purpose: free public knowledge library; distinct from admin image media_library. This branch is a candidate, not authorization to deploy. The previously published Dapur Vibe Coder release is independently linked.

## Private staging and release
1. Preserve current database and GAS version. Do not rerun setupDatabase unnecessarily.
2. Review Code.gs in staging, run setupPublicLibrary() as owner. It creates only public_library with exact headers and defaults STUDIO_PUBLIC_LIBRARY_ENABLED to false if absent. Existing flag is preserved; verify OFF before staging deployment.
3. Maintain the private bank in Drive; use the public_library sheet as a curated registry, not a copy of the entire bank. Use DRAFT/REVIEW for all unapproved records. Never store secrets or contact data in public fields. Internal notes and reviewer identities are not returned by API.
4. For each item, confirm ownership/licence permits public redistribution, audit privacy and sensitive business info, prepare a separate public-ready derivative, check access in incognito, enter only a reviewed direct resource URL. No public sharing of the bank folder.
5. Set rights_status=APPROVED, privacy_status=APPROVED, approved_by and approved_at, and status=PUBLISHED only after documented approval. All conditions required. Empty catalog is valid. The sheet is an owner-operated editorial console for this first iteration; full authenticated web admin editor is future work.
6. Test staging publicLibrary GET while disabled, then with harmless staging fixtures, including rejected drafts and URLs. Remove fixtures, confirm no internal fields, check mobile 360px, search/filter, keyboard navigation, download links, failure/retry and existing public site/admin.
7. Obtain owner approval for production merge, GAS deployment and enabling STUDIO_PUBLIC_LIBRARY_ENABLED. Rollback: set false immediately; revert to prior deployment/commit if required. Revoke public access on individual released derivatives separately if needed (flag only hides catalog entries).
8. No payment, login, membership, public file permissions or existing media_library changes in this candidate.

The catalog limits 500 rows and supports direct Google Drive files, Google Docs editors and releases under the owner's GitHub namespace. No arbitrary folder URLs or query parameters. Public catalog is not DRM; public file sharing must be managed independently. No private file IDs or source bank paths committed to public repo.
