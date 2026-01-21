package com.example.demo.security;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.demo.domain.AccountStatus;

public class UserPrincipal implements UserDetails {

    private final UUID userId;
    private final String egn;
    private final String passwordHash;
    private final AccountStatus accountStatus;

    public UserPrincipal(UUID userId, String egn, String passwordHash, AccountStatus accountStatus) {
        this.userId = userId;
        this.egn = egn;
        this.passwordHash = passwordHash;
        this.accountStatus = accountStatus;
    }

    public UUID getUserId() { return userId; }
    public AccountStatus getAccountStatus() { return accountStatus; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() { return passwordHash; }

    @Override
    public String getUsername() { return egn; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; } // active gating is handled by filter
}
