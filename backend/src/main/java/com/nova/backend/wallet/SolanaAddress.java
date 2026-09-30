package com.nova.backend.wallet;

import java.math.BigInteger;
import java.util.Arrays;

/**
 * Solana public-key checks, mirroring {@code @solana/addresses} (isAddress and
 * isOffCurveAddress). No Solana library is available to the backend build.
 *
 * Solana addresses carry no checksum: they are the raw 32-byte ed25519 public
 * key in Base58. What can be checked is the alphabet, that the text is the
 * canonical encoding of exactly 32 bytes, and that those bytes are a point on
 * the ed25519 curve. The curve check rejects program-derived addresses such as
 * a USDC token account, which a person cannot hold as a wallet.
 */
public final class SolanaAddress {
    private static final String ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    private static final BigInteger FIFTY_EIGHT = BigInteger.valueOf(58);
    private static final BigInteger P = BigInteger.TWO.pow(255).subtract(BigInteger.valueOf(19));
    private static final BigInteger D = BigInteger.valueOf(-121665)
        .multiply(BigInteger.valueOf(121666).modInverse(P)).mod(P);
    private static final BigInteger SQRT_M1 = BigInteger.TWO.modPow(P.subtract(BigInteger.ONE).shiftRight(2), P);

    private SolanaAddress() {}

    /** The 32 key bytes, or null unless the text is a canonical 32-byte Base58 key. */
    public static byte[] decode(String value) {
        if (value == null || value.length() < 32 || value.length() > 44) return null;
        BigInteger number = BigInteger.ZERO;
        int leadingZeros = 0;
        boolean counting = true;
        for (int i = 0; i < value.length(); i++) {
            int digit = ALPHABET.indexOf(value.charAt(i));
            if (digit < 0) return null;
            if (counting && digit == 0) leadingZeros++; else counting = false;
            number = number.multiply(FIFTY_EIGHT).add(BigInteger.valueOf(digit));
        }
        byte[] magnitude = number.signum() == 0 ? new byte[0] : number.toByteArray();
        if (magnitude.length > 0 && magnitude[0] == 0) magnitude = Arrays.copyOfRange(magnitude, 1, magnitude.length);
        if (leadingZeros + magnitude.length != 32) return null;
        byte[] bytes = new byte[32];
        System.arraycopy(magnitude, 0, bytes, 32 - magnitude.length, magnitude.length);
        return encode(bytes).equals(value) ? bytes : null;
    }

    public static String encode(byte[] bytes) {
        StringBuilder out = new StringBuilder();
        BigInteger number = new BigInteger(1, bytes);
        while (number.signum() > 0) {
            BigInteger[] division = number.divideAndRemainder(FIFTY_EIGHT);
            out.append(ALPHABET.charAt(division[1].intValue()));
            number = division[0];
        }
        for (int i = 0; i < bytes.length && bytes[i] == 0; i++) out.append('1');
        return out.reverse().toString();
    }

    /** A 32-byte key that is also on the ed25519 curve: an address a person's wallet can own. */
    public static boolean isWalletAddress(String value) {
        byte[] bytes = decode(value);
        return bytes != null && onCurve(bytes);
    }

    /** RFC 8032 point decompression: does the compressed point decode to (x, y)? */
    static boolean onCurve(byte[] compressed) {
        byte[] littleEndian = compressed.clone();
        boolean xOdd = (littleEndian[31] & 0x80) != 0;
        littleEndian[31] &= 0x7f;
        byte[] bigEndian = new byte[32];
        for (int i = 0; i < 32; i++) bigEndian[i] = littleEndian[31 - i];
        BigInteger y = new BigInteger(1, bigEndian);
        if (y.compareTo(P) >= 0) return false;
        BigInteger y2 = y.multiply(y).mod(P);
        BigInteger u = y2.subtract(BigInteger.ONE).mod(P);
        BigInteger v = D.multiply(y2).add(BigInteger.ONE).mod(P);
        // x = u * v^3 * (u * v^7)^((p-5)/8)
        BigInteger v3 = v.modPow(BigInteger.valueOf(3), P);
        BigInteger v7 = v.modPow(BigInteger.valueOf(7), P);
        BigInteger x = u.multiply(v3).multiply(u.multiply(v7).mod(P)
            .modPow(P.subtract(BigInteger.valueOf(5)).shiftRight(3), P)).mod(P);
        BigInteger vx2 = v.multiply(x).multiply(x).mod(P);
        if (!vx2.equals(u)) {
            if (!vx2.equals(u.negate().mod(P))) return false;
            x = x.multiply(SQRT_M1).mod(P);
        }
        return !(x.signum() == 0 && xOdd);
    }
}
