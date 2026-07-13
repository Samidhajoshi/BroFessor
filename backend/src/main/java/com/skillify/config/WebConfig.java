package com.skillify.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Profile photos are now stored on Cloudinary and served directly from
 * Cloudinary's CDN (see CloudinaryConfig + UserService.uploadPhoto), so this
 * class no longer needs to expose a local /uploads/** static resource handler.
 * Kept as an extension point for future WebMvc customization.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
}
