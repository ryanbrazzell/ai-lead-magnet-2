# Multi-Step Form Testing Guide

## Overview
This guide walks through testing all features of the 4-screen progressive disclosure form with Close CRM integration.

## Pre-Testing Checklist

### Environment Setup
- [ ] Verify `.env.local` exists with `CLOSE_API_KEY` set
- [ ] Verify API key is valid and has permissions to create/update leads
- [ ] Start dev server: `npm run dev`
- [ ] Open browser console to see API errors

### Close CRM Setup
- [ ] Verify custom fields exist in Close CRM:
  - `Employee Count` (text/number)
  - `Annual Revenue` (text/dropdown)
  - `Primary Pain Points` (text)
  - `BBYT Report` (text/URL)

## Feature Testing

### Screen 1: Name Collection
**Expected Behavior:**
- Two input fields: First Name and Last Name
- Fields side-by-side on desktop, stacked on mobile
- Purple "LET'S START" button
- No API call when submitted
- Proceeds to Screen 2 immediately

**Test Cases:**
1. ✅ Enter first name only → Should show validation error
2. ✅ Enter last name only → Should show validation error
3. ✅ Enter both names → Should proceed to Screen 2
4. ✅ Navigate back from Screen 2 → Should return to Screen 1 with data preserved

### Screen 2: Email Collection & Lead Creation
**Expected Behavior:**
- Single email input field
- Yellow "CONTINUE" button
- "Previous" link above form
- Creates lead in Close CRM with name + email
- Shows error if API fails
- Proceeds to Screen 3 on success

**Test Cases:**
1. ✅ Enter invalid email → Should show validation error
2. ✅ Enter valid email → Should create lead in Close CRM
3. ✅ Check Close CRM → Lead should appear with name and email
4. ✅ If API fails → Should show error message (check console for details)
5. ✅ Navigate back → Should return to Screen 1 with data preserved

**Debugging Screen 2 Issues:**
- Check browser console for API errors
- Check server logs for Close CRM API responses
- Verify API key is correct
- Verify Close CRM API is accessible
- Check network tab for request/response details

### Screen 3: Phone Collection
**Expected Behavior:**
- Phone input with "+1" prefix
- Yellow "CONTINUE" button
- "Previous" link above form
- Updates lead in Close CRM with phone number
- Non-blocking (proceeds even if API fails)

**Test Cases:**
1. ✅ Enter invalid phone (< 10 digits) → Should show validation error
2. ✅ Enter valid phone → Should update lead in Close CRM
3. ✅ Check Close CRM → Lead should have phone number added
4. ✅ Navigate back → Should return to Screen 2 with data preserved

### Screen 4: Business Details (Combined)
**Expected Behavior:**
- Three fields on one screen:
  - Employee Count (text input)
  - Annual Revenue (dropdown)
  - Pain Points (textarea)
- Purple "GET MY EA ROADMAP" button
- "Previous" link above form
- Updates lead with all three fields
- Navigates to thank-you page on submit

**Test Cases:**
1. ✅ Submit without employee count → Should show validation error
2. ✅ Submit without revenue → Should show validation error
3. ✅ Submit with invalid employee count (0 or negative) → Should show error
4. ✅ Submit with all valid data → Should update lead in Close CRM
5. ✅ Check Close CRM → Lead should have:
   - Employee Count in custom field
   - Annual Revenue in custom field
   - Primary Pain Points in custom field
6. ✅ Navigate back → Should return to Screen 3 with data preserved

## Form Navigation Testing

### Previous Link Functionality
- [ ] Screen 2 → Previous → Returns to Screen 1
- [ ] Screen 3 → Previous → Returns to Screen 2
- [ ] Screen 4 → Previous → Returns to Screen 3
- [ ] All form data preserved when navigating back/forward

### Data Persistence
- [ ] Fill Screen 1 → Navigate to Screen 2 → Go back → Data still there
- [ ] Fill multiple screens → Refresh page → Data should be lost (expected)
- [ ] Fill form → Navigate back and forth → All data preserved

## Validation Testing

### Field Validation
- [ ] First Name: Required, shows error if empty
- [ ] Last Name: Required, shows error if empty
- [ ] Email: Required, validates format, shows error if invalid
- [ ] Phone: Required, validates minimum 10 digits, shows error if invalid
- [ ] Employee Count: Required, validates positive number, shows error if invalid
- [ ] Revenue: Required, validates selection, shows error if not selected

### Error Display
- [ ] Errors appear below each field
- [ ] Errors clear when user corrects input
- [ ] Multiple errors can display simultaneously
- [ ] Error messages are user-friendly

## Close CRM Integration Testing

### Lead Creation (Screen 2)
- [ ] Lead created with correct name
- [ ] Email added to lead contact
- [ ] Lead ID returned and stored
- [ ] Error handling works if API fails

### Lead Updates (Screens 3-4)
- [ ] Phone added to existing lead
- [ ] Custom fields updated correctly:
  - Employee Count → `custom['Employee Count']`
  - Annual Revenue → `custom['Annual Revenue']`
  - Primary Pain Points → `custom['Primary Pain Points']`
- [ ] Non-blocking updates (form proceeds even if API fails)

## UI/UX Testing

### Responsive Design
- [ ] Mobile (375px): Fields stack vertically, layout works
- [ ] Tablet (768px): Layout adapts appropriately
- [ ] Desktop (1024px+): Name fields side-by-side, centered layout

### Button States
- [ ] Loading state shows spinner during API calls
- [ ] Buttons disabled during loading
- [ ] Button colors: Purple (Screen 1, 4), Yellow (Screen 2, 3)

### Animations
- [ ] Smooth transitions between screens (300ms fade)
- [ ] No page reloads (client-side navigation)

## Error Scenarios

### Network Errors
- [ ] Offline → Shows network error message
- [ ] Slow connection → Loading state works correctly
- [ ] API timeout → Error message displayed

### API Errors
- [ ] Invalid API key → Error message shown (Screen 2 only)
- [ ] Close CRM down → Error message shown (Screen 2 only)
- [ ] Invalid custom field names → Logged but non-blocking (Screens 3-4)

## Known Issues & Fixes

### Issue: "Failed to create lead" on Screen 2
**Possible Causes:**
1. API key not set or invalid
2. Close CRM API structure issue
3. Network/CORS issue

**Debugging Steps:**
1. Check `.env.local` has `CLOSE_API_KEY` set
2. Check browser console for detailed error message
3. Check server logs for Close CRM API response
4. Verify API key permissions in Close CRM
5. Test API key directly with curl:
   ```bash
   curl -X POST https://api.close.com/api/v1/lead/ \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Lead"}'
   ```

**Recent Fixes Applied:**
- Improved error handling to show actual Close CRM error messages
- Changed lead creation to create lead first, then update with email
- Added detailed error logging in server console

## Next Steps After Testing

1. If Screen 2 still fails:
   - Check server logs for detailed error
   - Verify Close CRM API key format
   - Test API key directly with Close CRM API

2. If custom fields don't update:
   - Verify field names match exactly in Close CRM
   - Check field types match (text vs number vs dropdown)
   - Check server logs for field mapping errors

3. If navigation doesn't work:
   - Check browser console for JavaScript errors
   - Verify Framer Motion is installed
   - Check form state management

## Success Criteria

✅ All 4 screens display correctly
✅ Form validation works on all fields
✅ Navigation (Previous links) works
✅ Data persists during navigation
✅ Lead created in Close CRM at Screen 2
✅ Lead updated with phone at Screen 3
✅ Lead updated with business details at Screen 4
✅ Error messages display correctly
✅ Loading states work
✅ Responsive design works on all breakpoints

