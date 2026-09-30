package com.nova.backend.wallet;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.security.SecureRandom;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** Expected results were produced with @solana/kit isAddress and isOffCurveAddress. */
class SolanaAddressTest {
    @ParameterizedTest
    @ValueSource(strings = {
        "Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyr", "BucXFPoNNN7NL9Kv7ocXvsxw1BxRn5U5r7ky5MFqmdSA",
        "3fgEzVyVySaGd7N1QCbwhiPPyoFUwjSsVfnPCARsHjQ4", "HcPgN1L8NC1TQq2TboHPi2GX763FGSE3r3zDiiNLCgqY",
        "7xVYUrUR2PA6aoW4f9KCJJAUt9gHoeKzod6ErFtGcH3X", "DxiTfabW7Nn83vQCjUkfFM4ryBtSLLxkab7eZ7UTY258",
        "2yJhfXi49hvTSS8nwUapzLZ8UXqAXW9RXV5X6fma1j5V", "3V77tjRef6TkwTvJQXLRnDcf9uK2bXPJhkrr19ZseLh6",
        "7r8b8ND3HCfmYCjGJtdP6yntuEhrVEpVHea2YBu9LHKm", "FUs3PY1JjzsYcuLJsjJbam9rCYb3z2kX9rT7UErzroHm",
        "8wsANPE42Y2htEPDEQe52eXApvBXtXsJBau2KEt47Mpx", "11111111111111111111111111111111"})
    void acceptsOnCurveKeys(String address) {
        assertTrue(SolanaAddress.isWalletAddress(address), address);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        // The USDC associated token account of Eiz8…dyr: a PDA, not a wallet.
        "EN7aZiLodQAvZYrRR3eRdNacJreFv8BiwgnDyNSBimud",
        // Eiz8…dyr with its last letter's case changed: still Base58, but off the curve.
        "Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyR",
        "BT74uKmdaYRwK51JTmAZTvQc6eMTtEzeu16rnj5PeR2P", "Ga6FrTawndo3MXshv9uwovwSyGSKCx4Ycs4SfDPPqgWM",
        "C6NNkG96YLHZhYsVXdGq74fE2e5ptNN4vRf32MEUgAEy", "A9ohPjmep1WwHidvTg6gazK7W75QSMWxeRtnMRi4KwDk",
        "DJc5p6cnkdurHjrqx8mnHS157VV1XXvGuW5gjACbXsPv", "3aLUARDeE97Et3Qb1wQ5vSCpLDJosr2Yqq1cSoSGHPpY"})
    void rejectsOffCurveAddresses(String address) {
        assertNotNull(SolanaAddress.decode(address), address);
        assertFalse(SolanaAddress.isWalletAddress(address), address);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "", "1111111111111111111111111111111", // 31 bytes
        "Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dy0", // '0' is not Base58
        "Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyO", "Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyI",
        "Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyl",
        " Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyr",
        "https://explorer.solana.com/address/Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyr",
        "Eiz8weAjGbquFPPw98EkgLeQyoRkH2i9hUzqLHh64dyrEiz8", // 35 bytes
        "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"})   // more than 32 bytes
    void rejectsNonAddresses(String value) {
        assertNull(SolanaAddress.decode(value), value);
        assertFalse(SolanaAddress.isWalletAddress(value), value);
    }

    @Test
    void rejectsSixtyFourByteSecretKeys() {
        byte[] secret = new byte[64];
        new SecureRandom().nextBytes(secret);
        assertFalse(SolanaAddress.isWalletAddress(SolanaAddress.encode(secret)));
    }

    @Test
    void roundTripsKeyBytes() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        key[0] = 0; // leading zero bytes encode as '1'
        String encoded = SolanaAddress.encode(key);
        assertEquals('1', encoded.charAt(0));
        assertArrayEquals(key, SolanaAddress.decode(encoded));
    }
}
