/* =========================================================
   DOOM AI — ADVANCED OTP AUTHENTICATION & LOGOUT ENGINE
   ========================================================= */

(function () {
  const STORAGE_KEY = 'doom_auth_token';
  let currentUser = null;
  let pendingIdentifier = '';
  let pendingOtpPreview = '';
  let resendTimerInterval = null;
  let cooldownRemaining = 0;

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

  function initAuth() {
    injectAuthModal();
    injectToastContainer();
    setupGlobalClickListeners();
    checkAuthSession();

    // Cross-tab synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        checkAuthSession();
      }
    });
  }

  /* ---------------------------------------------------------
     INJECT AUTH MODAL HTML DYNAMICALLY
  --------------------------------------------------------- */
  function injectAuthModal() {
    if (document.getElementById('doomAuthModal')) return;

    const modalHtml = `
      <div class="auth-modal-overlay" id="doomAuthModal" onclick="if(event.target===this)DoomAuth.closeModal()">
        <div class="auth-modal-card" role="dialog" aria-labelledby="authTitle">
          <button class="auth-close-btn" onclick="DoomAuth.closeModal()" aria-label="Close">✕</button>
          
          <!-- MODAL HEADER -->
          <div class="auth-header">
            <div class="auth-emblem">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 id="authTitle">DOOM AI Access</h3>
            <p id="authSubtitle">Passwordless login with instant One-Time Password (OTP)</p>
          </div>

          <!-- STEP 1: REQUEST OTP FORM -->
          <div id="authStep1">
            <form onsubmit="event.preventDefault(); DoomAuth.handleSendOtp();">
              <div class="auth-input-group">
                <label class="auth-label" for="authIdentifierInput">Email Address or Mobile Number</label>
                <div class="auth-input-wrap">
                  <span class="auth-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </span>
                  <input type="text" id="authIdentifierInput" class="auth-text-input" placeholder="e.g. saurbh@example.com or +1 555-0199" required autocomplete="username" />
                </div>
              </div>

              <button type="submit" class="auth-submit-btn" id="sendOtpBtn">
                <span>Send Verification Code</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </form>
          </div>

          <!-- STEP 2: VERIFY OTP FORM -->
          <div id="authStep2" style="display:none">
            <!-- AUTO-FILL TEST HELPER -->
            <div class="otp-demo-helper" id="otpPreviewBanner">
              <div class="otp-demo-info">
                <span style="font-size:11px;color:#cbd2e5">🔑 Test Code:</span>
                <span class="otp-code-pill" id="otpPreviewCode">000000</span>
              </div>
              <button type="button" class="otp-autofill-btn" onclick="DoomAuth.autoFillOtp()">
                ⚡ Auto-fill Code
              </button>
            </div>

            <form onsubmit="event.preventDefault(); DoomAuth.handleVerifyOtp();">
              <div class="auth-input-group">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <label class="auth-label" style="margin:0">Enter 6-Digit Code</label>
                  <a class="otp-back-link" onclick="DoomAuth.backToStep1()">Change Email / Mobile</a>
                </div>

                <div class="otp-boxes-container" id="otpBoxes">
                  <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-digit-box" data-index="0" autocomplete="one-time-code" />
                  <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-digit-box" data-index="1" />
                  <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-digit-box" data-index="2" />
                  <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-digit-box" data-index="3" />
                  <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-digit-box" data-index="4" />
                  <input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]*" class="otp-digit-box" data-index="5" />
                </div>
              </div>

              <!-- TIMER & RESEND LINK -->
              <div class="otp-timer-row">
                <span id="otpTimerText">Resend code in 45s</span>
                <button type="button" class="otp-resend-btn" id="resendOtpBtn" onclick="DoomAuth.handleResendOtp()" disabled>
                  Resend Code
                </button>
              </div>

              <button type="submit" class="auth-submit-btn" id="verifyOtpBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Verify & Sign In</span>
              </button>
            </form>
          </div>

          <!-- SECURITY BADGE -->
          <div class="auth-security-footer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>End-to-End Encrypted • Passwordless • Zero Data Leak</span>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setupOtpInputListeners();
  }

  function injectToastContainer() {
    if (document.getElementById('doomAuthToast')) return;
    const toast = document.createElement('div');
    toast.id = 'doomAuthToast';
    toast.className = 'auth-toast';
    document.body.appendChild(toast);
  }

  function showToast(msg, icon = '✓') {
    const toast = document.getElementById('doomAuthToast');
    if (!toast) return;
    toast.innerHTML = `<span style="color:#ffd000;font-size:16px">${icon}</span> <span>${msg}</span>`;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3600);
  }

  /* ---------------------------------------------------------
     6-DIGIT OTP BOX INTERACTIVITY (AUTO-FOCUS, BACKSPACE, PASTE)
  --------------------------------------------------------- */
  function setupOtpInputListeners() {
    const boxes = document.querySelectorAll('.otp-digit-box');
    boxes.forEach((box, idx) => {
      // Numbers only & jump to next box
      box.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? val.slice(-1) : '';
        if (val) {
          box.classList.add('filled');
          if (idx < boxes.length - 1) {
            boxes[idx + 1].focus();
          } else {
            // Last box filled, auto-verify if all filled
            checkAndAutoVerify();
          }
        } else {
          box.classList.remove('filled');
        }
      });

      // Backspace handling
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          if (!box.value && idx > 0) {
            boxes[idx - 1].focus();
            boxes[idx - 1].value = '';
            boxes[idx - 1].classList.remove('filled');
          } else {
            box.value = '';
            box.classList.remove('filled');
          }
        } else if (e.key === 'ArrowLeft' && idx > 0) {
          boxes[idx - 1].focus();
        } else if (e.key === 'ArrowRight' && idx < boxes.length - 1) {
          boxes[idx + 1].focus();
        }
      });

      // Paste entire 6-digit code
      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = (e.clipboardData || window.clipboardData).getData('text');
        const digits = pasteData.replace(/\D/g, '').slice(0, 6);
        if (!digits) return;

        digits.split('').forEach((d, i) => {
          if (boxes[i]) {
            boxes[i].value = d;
            boxes[i].classList.add('filled');
          }
        });

        if (digits.length === 6) {
          boxes[5].focus();
          DoomAuth.handleVerifyOtp();
        } else if (boxes[digits.length]) {
          boxes[digits.length].focus();
        }
      });
    });
  }

  function getEnteredOtp() {
    const boxes = document.querySelectorAll('.otp-digit-box');
    let code = '';
    boxes.forEach(b => code += (b.value || ''));
    return code;
  }

  function checkAndAutoVerify() {
    const code = getEnteredOtp();
    if (code.length === 6) {
      DoomAuth.handleVerifyOtp();
    }
  }

  /* ---------------------------------------------------------
     SESSION CHECK & NAVIGATION STATE RENDERING
  --------------------------------------------------------- */
  async function checkAuthSession() {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      currentUser = null;
      renderNavAuth(null);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.authenticated && data.user) {
        currentUser = data.user;
        renderNavAuth(currentUser);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        currentUser = null;
        renderNavAuth(null);
      }
    } catch (err) {
      console.warn('Session check failed:', err);
      renderNavAuth(currentUser);
    }
  }

  function renderNavAuth(user) {
    const containers = document.querySelectorAll('.auth-nav-container');
    if (!containers || containers.length === 0) return;

    containers.forEach(container => {
      if (!user) {
        // Logged out / Guest view
        container.innerHTML = `
          <button class="auth-nav-btn" onclick="DoomAuth.openModal()" id="navLoginBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span>Sign In</span>
          </button>
        `;
      } else {
        // Logged in user profile & dropdown
        const shortId = user.identifier.length > 16 ? user.identifier.substring(0, 14) + '...' : user.identifier;
        const initial = user.avatarInitial || user.name?.charAt(0) || 'U';

        container.innerHTML = `
          <button class="auth-user-pill" onclick="DoomAuth.toggleDropdown(event)" id="userProfileBtn">
            <span class="auth-user-avatar">${initial}</span>
            <span class="auth-user-name">${user.name || shortId}</span>
            <span class="auth-user-dot" title="Active Verified Session"></span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>

          <div class="auth-dropdown" id="authDropdownMenu">
            <div class="auth-dropdown-header">
              <div class="auth-dropdown-avatar">${initial}</div>
              <div class="auth-dropdown-details">
                <strong>${user.name}</strong>
                <span>${user.identifier}</span>
              </div>
            </div>

            <div class="auth-dropdown-meta">
              <div class="auth-dropdown-meta-item">
                <span>Account Status:</span>
                <span class="auth-status-tag">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  OTP Verified
                </span>
              </div>
              <div class="auth-dropdown-meta-item">
                <span>Role:</span>
                <span style="color:#fff;font-weight:600">${user.role || 'Member'}</span>
              </div>
              <div class="auth-dropdown-meta-item">
                <span>Session:</span>
                <span style="color:#45f6a8">Active (7 Days)</span>
              </div>
            </div>

            <button class="auth-logout-btn" onclick="DoomAuth.handleLogout()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Log Out</span>
            </button>
          </div>
        `;
      }
    });
  }

  function setupGlobalClickListeners() {
    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      const dropdowns = document.querySelectorAll('.auth-dropdown');
      dropdowns.forEach(dropdown => {
        if (!e.target.closest('.auth-nav-container')) {
          dropdown.classList.remove('active');
        }
      });
    });

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        DoomAuth.closeModal();
      }
    });
  }

  /* ---------------------------------------------------------
     EXPORTED DOOM AUTH CONTROLLER
  --------------------------------------------------------- */
  window.DoomAuth = {
    openModal() {
      const modal = document.getElementById('doomAuthModal');
      if (modal) {
        modal.classList.add('active');
        DoomAuth.backToStep1();
        setTimeout(() => {
          const input = document.getElementById('authIdentifierInput');
          if (input) input.focus();
        }, 150);
      }
    },

    closeModal() {
      const modal = document.getElementById('doomAuthModal');
      if (modal) {
        modal.classList.remove('active');
      }
    },

    toggleDropdown(e) {
      if (e) e.stopPropagation();
      const dropdown = document.getElementById('authDropdownMenu');
      if (dropdown) {
        dropdown.classList.toggle('active');
      }
    },

    backToStep1() {
      document.getElementById('authStep1').style.display = 'block';
      document.getElementById('authStep2').style.display = 'none';
      document.getElementById('authSubtitle').textContent = 'Passwordless login with instant One-Time Password (OTP)';
      clearInterval(resendTimerInterval);
    },

    async handleSendOtp() {
      const input = document.getElementById('authIdentifierInput');
      const val = input ? input.value.trim() : '';
      if (!val) return;

      const btn = document.getElementById('sendOtpBtn');
      btn.disabled = true;
      btn.innerHTML = `<span>Sending Code...</span>`;

      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: val })
        });
        const data = await res.json();

        if (!data.success) {
          showToast(data.error || 'Failed to send OTP', '⚠️');
          btn.disabled = false;
          btn.innerHTML = `<span>Send Verification Code</span>`;
          return;
        }

        pendingIdentifier = data.identifier;
        pendingOtpPreview = data.previewOtp || '';

        // Transition to Step 2
        document.getElementById('authStep1').style.display = 'none';
        document.getElementById('authStep2').style.display = 'block';
        document.getElementById('authSubtitle').textContent = `Verification code sent to ${pendingIdentifier}`;

        // Display test code helper
        const previewCodeEl = document.getElementById('otpPreviewCode');
        if (previewCodeEl) previewCodeEl.textContent = pendingOtpPreview;

        // Clear previous input boxes and focus first
        const boxes = document.querySelectorAll('.otp-digit-box');
        boxes.forEach(b => {
          b.value = '';
          b.classList.remove('filled');
        });
        setTimeout(() => {
          if (boxes[0]) boxes[0].focus();
        }, 100);

        showToast(`Verification code generated: ${pendingOtpPreview}`, '🔑');
        DoomAuth.startResendCooldown(data.cooldown || 45);

      } catch (err) {
        showToast('Network error sending verification code', '⚠️');
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Send Verification Code</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
      }
    },

    autoFillOtp() {
      if (!pendingOtpPreview) return;
      const boxes = document.querySelectorAll('.otp-digit-box');
      pendingOtpPreview.split('').forEach((digit, i) => {
        if (boxes[i]) {
          boxes[i].value = digit;
          boxes[i].classList.add('filled');
        }
      });
      DoomAuth.handleVerifyOtp();
    },

    startResendCooldown(seconds) {
      clearInterval(resendTimerInterval);
      cooldownRemaining = seconds;
      const timerText = document.getElementById('otpTimerText');
      const resendBtn = document.getElementById('resendOtpBtn');

      if (resendBtn) resendBtn.disabled = true;

      const updateUI = () => {
        if (timerText) {
          const mins = Math.floor(cooldownRemaining / 60);
          const secs = cooldownRemaining % 60;
          timerText.textContent = `Resend code in ${secs < 10 ? '0' : ''}${secs}s`;
        }
      };

      updateUI();
      resendTimerInterval = setInterval(() => {
        cooldownRemaining--;
        if (cooldownRemaining <= 0) {
          clearInterval(resendTimerInterval);
          if (timerText) timerText.textContent = 'Did not receive code?';
          if (resendBtn) resendBtn.disabled = false;
        } else {
          updateUI();
        }
      }, 1000);
    },

    async handleResendOtp() {
      if (!pendingIdentifier) return;
      const resendBtn = document.getElementById('resendOtpBtn');
      if (resendBtn) resendBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: pendingIdentifier })
        });
        const data = await res.json();
        if (data.success) {
          pendingOtpPreview = data.previewOtp || '';
          const previewCodeEl = document.getElementById('otpPreviewCode');
          if (previewCodeEl) previewCodeEl.textContent = pendingOtpPreview;
          showToast(`New code sent: ${pendingOtpPreview}`, '🔑');
          DoomAuth.startResendCooldown(data.cooldown || 45);
        } else {
          showToast(data.error || 'Failed to resend code', '⚠️');
          if (resendBtn) resendBtn.disabled = false;
        }
      } catch (e) {
        showToast('Error resending OTP', '⚠️');
        if (resendBtn) resendBtn.disabled = false;
      }
    },

    async handleVerifyOtp() {
      const code = getEnteredOtp();
      const boxesContainer = document.getElementById('otpBoxes');

      if (code.length < 6) {
        if (boxesContainer) {
          boxesContainer.classList.add('auth-shake');
          setTimeout(() => boxesContainer.classList.remove('auth-shake'), 400);
        }
        showToast('Please enter all 6 digits', '⚠️');
        return;
      }

      const verifyBtn = document.getElementById('verifyOtpBtn');
      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = `<span>Verifying...</span>`;
      }

      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: pendingIdentifier,
            otp: code
          })
        });

        const data = await res.json();

        if (!data.success) {
          if (boxesContainer) {
            boxesContainer.classList.add('auth-shake');
            setTimeout(() => boxesContainer.classList.remove('auth-shake'), 400);
          }
          showToast(data.error || 'Invalid verification code', '✕');
          return;
        }

        // Authentication Success!
        localStorage.setItem(STORAGE_KEY, data.token);
        currentUser = data.user;
        renderNavAuth(currentUser);

        showToast(`Welcome back, ${data.user.name}! Verified successfully.`, '⚡');
        DoomAuth.closeModal();

      } catch (err) {
        showToast('Network error during verification', '⚠️');
      } finally {
        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Verify & Sign In</span>
          `;
        }
      }
    },

    async handleLogout() {
      const token = localStorage.getItem(STORAGE_KEY);
      const userName = currentUser ? currentUser.name : 'User';

      try {
        if (token) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      } catch (e) {
        console.warn('Logout notification error:', e);
      } finally {
        localStorage.removeItem(STORAGE_KEY);
        currentUser = null;
        renderNavAuth(null);
        showToast(`Goodbye, ${userName}. You are now logged out.`, '✓');
      }
    },

    getCurrentUser() {
      return currentUser;
    }
  };
})();
