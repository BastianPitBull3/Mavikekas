---
name: deploy-mavikekas
description: Deploy the Mavikekas taco/quesadilla ordering app to Firebase Hosting. Runs `npx firebase-tools deploy` in D:\Proyectos\Mavikekas. Use whenever the user asks to deploy, publish, ship, push live, or put Mavikekas changes on the real site, even if they just say "deploy it" or "sube los cambios" without naming Firebase explicitly.
---

# Deploy Mavikekas

Publishes the current build of the Mavikekas app to Firebase Hosting.

## Steps

1. **Rebuild first.** Firebase Hosting serves whatever is in `dist/` (see `firebase.json` → `hosting.public`), not the source files directly. If there are source changes since the last build, run:
   ```bash
   cd "D:\Proyectos\Mavikekas" && npm run build
   ```
   Skip this only if `dist/` is already confirmed up to date with the latest changes.

2. **Deploy — hosting only:**
   ```bash
   cd "D:\Proyectos\Mavikekas" && npx firebase-tools deploy --only hosting
   ```
   Always include `--only hosting` here. `firebase.json` also declares a `firestore.rules` section (used for the separate `mavikekas-dev-690e0` dev project); a bare `firebase deploy` would also push that rules file to **production** and silently overwrite whatever rules are actually configured there. Never deploy Firestore rules to production from this skill.

3. **Confirm before running step 2.** This pushes to the live, production site — a shared resource other people use. If the user's request this turn wasn't an explicit, unambiguous "yes, deploy now," ask for confirmation first rather than deploying automatically.

4. **Report the result.** Firebase prints a Hosting URL on success — share it back to the user. If the deploy fails (e.g. not logged in, wrong project), surface the actual error rather than retrying blindly.
