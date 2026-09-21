# Appearance

The app was built from `specification.md` through acceptance criteria that
describe behaviour. `design-brief.md` was written as a prompt for a UI mock, and
the mock it produced was never turned into tickets — so every screen's
composition was invented at implementation time and the two drifted.

This epic closes that. It changes no behaviour and no domain code: every figure
these tickets place is already computed and already on screen somewhere.

**Two screens were mocked** — Dashboard and Capital. Those are what APP-03 to
APP-07 match. Projection, Commitments, Scenarios and Settings have prose in the
brief and no mock; they inherit APP-01 and APP-02 and are otherwise out of
scope, because matching a screen nobody drew means inventing one and calling it
a match.

**Two things in the mock are not reachable.** The macOS window chrome around it
belongs to a desktop build that is deliberately deferred (`architecture.md` —
Stack), and the figures in it are invented by the mock generator, so nothing
here hardcodes €200,000 or "2 accounts · 1 asset".
