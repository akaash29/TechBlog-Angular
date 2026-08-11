/* Wire DTOs — shaped to match the UserRegistration .NET API exactly
 * (UserRegistration.Application/DTOs/Auth and DTOs/Users). Keep these
 * in lockstep with the backend; everything else in the app works with
 * the camelCase client-side types further down instead.
 *
 * Casing is asymmetric on purpose: ASP.NET Core's [FromBody] model
 * binding is case-insensitive, so PascalCase request bodies (matching
 * the C# DTO property names) bind correctly. But its default
 * System.Text.Json *output* serializer camelCases property names — so
 * response shapes below must be camelCase to actually read the real
 * payload, not just match the C# class. */

export interface LoginRequest {
  EmailOrUserName: string;
  Password: string;
}

export interface RegisterRequest {
  UserName: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Role: string;
  Password: string;
}

export interface RefreshTokenRequest {
  RefreshToken: string;
}

/** POST /auth/login and POST /auth/refresh both return this shape. */
export interface AuthApiResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

/** POST /users/register returns the created user, not a token pair —
 *  self-registration signs in via a separate login call. */
export interface RegisteredUser {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/** GET/PUT /users/{id} and the profile-image upload endpoint all return this
 *  shape — the JWT only carries id/userName/email/role (see AuthUser below),
 *  so this is fetched separately whenever the rest of the profile is needed. */
export interface UserProfile {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  phone: string | null;
  city: string | null;
  profileImagePath: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateUserRequest {
  FirstName: string;
  LastName: string;
  Phone: string | null;
  City: string | null;
  Role: string;
  IsActive: boolean;
}

/* Client-side types — what the app actually reads from/writes to. */

export interface AuthUser {
  id: string;
  userName: string;
  email: string;
  role: string;
}

/** What AuthService stores and streams after a successful login/refresh. */
export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
}
