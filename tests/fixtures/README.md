Fixtures used by Playwright E2E tests.

- `sample.pdf` is a small two-page PDF generated locally for this repo.
- `encrypted.pdf` comes from the `qpdf` test suite:
  `https://github.com/qpdf/qpdf/blob/main/qpdf/qtest/qpdf/encrypted-40-bit-R3.pdf`
  under the Apache-2.0 license. The known password is `623`.
- `owner-encrypted.pdf` comes from the `qpdf` test suite:
  `https://github.com/qpdf/qpdf/blob/main/qpdf/qtest/qpdf/enc-R3,V2,O=master.pdf`
  under the Apache-2.0 license. It opens without a user password but still carries PDF encryption.
