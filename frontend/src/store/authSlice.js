import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://dotproduct-exec.onrender.com";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        if (!response.ok) {
          return rejectWithValue(
            `Login failed: ${response.status} ${response.statusText}.`
          );
        }
        return rejectWithValue(
          "Login failed: Invalid response from server when fetching token."
        );
      }

      if (!response.ok) {
        const errorMessage =
          data?.message || data?.detail || `Login failed: ${response.status}.`;
        return rejectWithValue(errorMessage);
      }

      const token = data.access;
      if (!token) {
        return rejectWithValue(
          "Login successful, but no authentication token was received."
        );
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
      }

      const userProfile = await dispatch(fetchUserProfile(token)).unwrap();

      if (!userProfile || Object.keys(userProfile).length === 0) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
        }
        return rejectWithValue(
          "Login successful, but user profile could not be retrieved or is empty."
        );
      }

      return { token, user: userProfile };
    } catch (error) {
      let errorMessage = "An unexpected error occurred during login.";
      if (error && typeof error === "string") {
        errorMessage = error;
      } else if (error && error.message) {
        errorMessage = error.message;
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (token, { rejectWithValue }) => {
    if (!token) {
      return rejectWithValue(
        "Authentication token not provided for profile fetch."
      );
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        if (!response.ok) {
          return rejectWithValue(
            `Failed to fetch profile: ${response.status} ${response.statusText}.`
          );
        }
        return rejectWithValue(
          "Failed to fetch profile: Invalid response from server when fetching profile."
        );
      }

      if (!response.ok) {
        const errorMessage =
          data?.message ||
          data?.detail ||
          `Failed to fetch profile: ${response.status}.`;
        if (response.status === 401 || response.status === 403) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
          }
        }
        return rejectWithValue(errorMessage);
      }

      if (!data || Object.keys(data).length === 0) {
        return rejectWithValue(
          "User profile data received from server is empty or invalid."
        );
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(data));
      }
      return data;
    } catch (error) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
      return rejectWithValue(
        error.message ||
          "An unexpected error occurred while fetching user profile."
      );
    }
  }
);

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          password: userData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMessage =
          data?.message || data?.detail || "Signup failed. Please try again.";
        return rejectWithValue(errorMessage);
      }
      return data;
    } catch (error) {
      return rejectWithValue(
        error.message || "An unexpected error occurred during signup."
      );
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, { dispatch, rejectWithValue }) => {
    let token = null;
    let user = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("authToken");
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch (e) {
          localStorage.removeItem("user");
        }
      }
    }

    if (token && user) {
      try {
        const freshUserProfile = await dispatch(
          fetchUserProfile(token)
        ).unwrap();
        return { token, user: freshUserProfile };
      } catch (error) {
        return rejectWithValue(
          typeof error === "string" ? error : "Session validation failed."
        );
      }
    }
    return rejectWithValue("No valid session found in local storage.");
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Signup failed";
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.user = null;
      })
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        if (
          action.payload &&
          action.payload !== "No token found." &&
          action.payload !== "No valid session found in local storage."
        ) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
