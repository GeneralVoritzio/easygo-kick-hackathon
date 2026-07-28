# Settings pages, read from the live logged-in DOM

Captured 26 July 2026 at 2560 by 1305. Account values are replaced with placeholders.
`{WxH}` is the measured border box. `|N cls` is the count of Tailwind classes on that element.

The settings shell is shared. Only the panel to the right of the tab rail changes.

## The settings shell

```
main
  h1 {2220x52}  "Settings"
  div                       the tab rail
    a[href=/settings/profile][data-state=active]
      div                   the active underline
      "Profile"
    a[href=/settings/security]          "Security"
    a[href=/settings/preferences]       "Preferences"
    a[href=/settings/notifications]     "Notifications"
    a[href=/settings/connections]       "Connections"
    a[href=/settings/developer]         "Developer"
    a[href=/settings/payment-methods]   "Payment methods"
  div                       the panel
    div
      h2 {824x24}           the panel title
    section                 one card per group
```

The panel is **824px wide** at this viewport. Every group is a `section`, and every section
carries a `h3` title, an optional `span` of help text, then its controls.

Seven tabs exist. The brief names two of them.

## `/settings/profile`

```
h2 {824x24} "Profile"

section  "Profile Preview"
  img                                   the avatar
  button {89x36}   "Edit Avatar"
  img                                   the banner behind the preview card
  div              "About <USERNAME>"
  span             "<N>" + "Followers"
  p                "<USERNAME>'s Kick Channel"

section  "Channel Banner"
  img
  button {170x32}  "Update Banner image"
  span             "Minimum image size: 1200x134px and less than 4MB"

section  "Offline Stream Banner"
  img
  button {170x32}  "Update Banner image"
  span             "This banner image will display for two minutes upo…"

section  "Basic Details"
  form
    label {69x17}  "Username"
    input[name=username] {812x36}
    button[type=reset][disabled]  {71x32}   "Cancel"
    button[type=submit][disabled] {119x32}  "Save changes"
  form
    label {36x17}  "Email"
    input[name=email] {812x36}
    button[type=reset][disabled]  {71x32}   "Cancel"
    button[type=submit][disabled] {119x32}  "Save changes"
```

Each field is **its own `form`** with its own Cancel and Save pair. Both buttons start
`disabled` and enable when the field changes. The input is 812px inside the 824px panel, so
the padding is 6px a side.

## `/settings/preferences`

One section, three switches. This is the whole page.

```
h2 {824x24} "Preferences"

section  "Content Preferences"
  span   "Customize your experience by selecting the types o…"
  div
    span    "Hide Pools, Hot Tubs & Bikinis"
    button[role=switch][aria-checked=false][data-state=unchecked] {36x20}
      span[data-state=unchecked]                the knob
  div
    span    "Hide Slots & Casino"
    button[role=switch][aria-checked=false][data-state=unchecked] {36x20}
  div
    span    "Hide VR Chat"
    button[role=switch][aria-checked=false][data-state=unchecked] {36x20}
```

The switch is a **36 by 20** button with `role="switch"`, and it carries both `aria-checked`
and `data-state`. The knob is a `span` that reads `data-state` off itself, not off the parent.
This is the Radix switch pattern, so drive the styling from `data-state`.
