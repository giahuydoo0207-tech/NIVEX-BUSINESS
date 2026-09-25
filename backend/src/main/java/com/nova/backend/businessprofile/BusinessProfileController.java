package com.nova.backend.businessprofile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Validated
@RequestMapping("/api/v1/business/profile")
public class BusinessProfileController {
    private static final Map<String, Integer> MAX_BYTES = Map.of("AVATAR", 5 * 1024 * 1024, "COVER", 8 * 1024 * 1024);
    private final BusinessProfileRepository repository;

    public BusinessProfileController(BusinessProfileRepository repository) { this.repository = repository; }

    @GetMapping
    public BusinessProfile current() { return repository.current(); }

    @PatchMapping
    public BusinessProfile update(@Valid @RequestBody UpdateProfileRequest request) {
        return repository.update(request.name(), request.category(), request.bio());
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BusinessProfile avatar(@RequestPart("file") MultipartFile file) { return upload("AVATAR", file); }

    @PostMapping(value = "/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BusinessProfile cover(@RequestPart("file") MultipartFile file) { return upload("COVER", file); }

    private BusinessProfile upload(String type, MultipartFile file) {
        if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An image file is required");
        if (file.getSize() > MAX_BYTES.get(type)) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, type + " image is too large");
        try {
            byte[] content = file.getBytes();
            String contentType = imageType(content);
            String filename = file.getOriginalFilename() == null ? type.toLowerCase(Locale.ROOT) : file.getOriginalFilename();
            return repository.storeAsset(type, filename.substring(0, Math.min(filename.length(), 255)), contentType, content);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read the image", exception);
        }
    }

    private String imageType(byte[] bytes) {
        if (bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47) return MediaType.IMAGE_PNG_VALUE;
        if (bytes.length >= 3 && bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8 && bytes[2] == (byte) 0xff) return MediaType.IMAGE_JPEG_VALUE;
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') return "image/webp";
        throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only PNG, JPEG, and WebP images are allowed");
    }

    public record UpdateProfileRequest(@NotBlank @Size(max = 160) String name, @NotBlank @Size(max = 240) String category, @NotBlank @Size(max = 2000) String bio) {}
}
