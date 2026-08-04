# Implementation Plan - Profile Settings

This plan outlines the steps to implement the "Profile Settings" page, allowing users to update their personal information (phone number) and change their password.

## Proposed Changes

### Backend (Django)

#### [MODIFY] [views.py](file:///F:/hotel%20management/hotel-system/backend/apps/accounts/views.py)
- Update `MeView` to support `PATCH` requests for updating the current user's profile.
- Implement logic to handle password changes securely using `set_password()`.

---

### Frontend (React Admin)

#### [NEW] [Profile.tsx](file:///F:/hotel%20management/hotel-system/web-admin/src/pages/Profile.tsx)
- Create a new page with sections for:
    - **General Information:** Update Username (read-only?), First Name, Last Name, and Phone Number.
    - **Security:** Update Password (requires Current Password, New Password, and Confirmation).
- Use consistent styling (slate/primary palette).

#### [MODIFY] [App.tsx](file:///F:/hotel%20management/hotel-system/web-admin/src/App.tsx)
- Register the `/profile` route.

#### [MODIFY] [ProtectedRoute.tsx](file:///F:/hotel%20management/hotel-system/web-admin/src/components/ProtectedRoute.tsx)
- Change the "Profile Settings" button in the gear dropdown to a `Link` pointing to `/profile`.

## Verification Plan

### Manual Verification
1.  **Navigate to Profile:** Click "Profile Settings" in the header dropdown.
2.  **Update Info:** Change the phone number and save. Verify the change persists after refresh.
3.  **Change Password:** Update the password and verify the user can log in with the new password after logging out.
4.  **Error Handling:** Verify that providing an incorrect current password or mismatched new passwords shows appropriate error messages.
