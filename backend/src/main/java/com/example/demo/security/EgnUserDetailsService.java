package com.example.demo.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.example.demo.domain.User;
import com.example.demo.repository.UserRepository;

public class EgnUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public EgnUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String egn) throws UsernameNotFoundException {
        User user = userRepository.findByEgn(egn)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new UserPrincipal(user.getId(), user.getEgn(), user.getPasswordHash(), user.getAccountStatus());
    }
}
