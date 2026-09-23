package com.nova.backend.payment;

import java.sql.ResultSet;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PaymentFinalizationJobTest {
    @Test void keepsProcessingAfterOneRpcFailure() throws Exception {
        var jdbc = mock(JdbcTemplate.class);
        var payments = mock(PaymentService.class);
        UUID first = UUID.randomUUID(), second = UUID.randomUUID();
        when(jdbc.query(anyString(), any(RowMapper.class))).thenAnswer(invocation -> {
            RowMapper<?> mapper = invocation.getArgument(1);
            var row = mock(ResultSet.class);
            when(row.getObject(1, UUID.class)).thenReturn(first, second);
            when(row.getString(2)).thenReturn("first", "second");
            return java.util.List.of(mapper.mapRow(row,0), mapper.mapRow(row,1));
        });
        when(payments.verify(first,"first")).thenThrow(
            new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE));
        new PaymentFinalizationJob(jdbc,payments).finalizeDetected();
        verify(payments).verify(second,"second");
        verify(jdbc).update(anyString(),eq(first));
        verify(jdbc).update(anyString(),eq(second));
    }
}
