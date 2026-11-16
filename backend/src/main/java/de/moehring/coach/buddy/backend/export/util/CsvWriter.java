package de.moehring.coach.buddy.backend.export.util;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Builds CSV documents that open correctly in German Excel: semicolon as separator,
 * CRLF line endings and a UTF-8 byte order mark so umlauts survive.
 */
public final class CsvWriter {

    private static final char SEPARATOR = ';';
    private static final String LINE_BREAK = "\r\n";
    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    // Phone numbers like "+49 170 1234567" start with a sign but are harmless.
    private static final Pattern NUMBER_LIKE = Pattern.compile("^[+-]?[\\d\\s()/.-]+$");

    private final StringBuilder content = new StringBuilder();

    public CsvWriter row(List<?> values) {
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) {
                content.append(SEPARATOR);
            }
            content.append(escape(values.get(i)));
        }
        content.append(LINE_BREAK);
        return this;
    }

    public CsvWriter row(Object... values) {
        return row(Arrays.asList(values));
    }

    public byte[] toBytes() {
        byte[] body = content.toString().getBytes(StandardCharsets.UTF_8);
        byte[] result = new byte[UTF8_BOM.length + body.length];
        System.arraycopy(UTF8_BOM, 0, result, 0, UTF8_BOM.length);
        System.arraycopy(body, 0, result, UTF8_BOM.length, body.length);
        return result;
    }

    static String escape(Object value) {
        if (value == null) {
            return "";
        }

        String text = neutralizeFormula(value.toString());

        boolean needsQuotes = text.indexOf(SEPARATOR) >= 0
                || text.indexOf('"') >= 0
                || text.indexOf('\n') >= 0
                || text.indexOf('\r') >= 0;

        if (!needsQuotes) {
            return text;
        }

        return '"' + text.replace("\"", "\"\"") + '"';
    }

    /**
     * Prevents spreadsheet formula injection: free text such as names or notes must
     * never be interpreted as a formula when the file is opened in Excel.
     */
    private static String neutralizeFormula(String text) {
        if (text.isEmpty()) {
            return text;
        }

        char first = text.charAt(0);
        boolean dangerous = first == '=' || first == '@' || first == '\t' || first == '\r'
                || ((first == '+' || first == '-') && !NUMBER_LIKE.matcher(text).matches());

        return dangerous ? "'" + text : text;
    }
}
