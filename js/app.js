document.addEventListener('DOMContentLoaded', () => {
    // --- Localization (i18n) Setup ---
    const currentLang = localStorage.getItem('drink_lang') || 'en';
    
    // Set html lang attribute
    document.documentElement.setAttribute('lang', currentLang);

    // Prevent flash of untranslated content (FOUT) if not English
    if (currentLang !== 'en') {
        document.documentElement.style.opacity = '0';
        document.documentElement.style.transition = 'opacity 0.25s ease';
    }

    // Load translations dynamically
    const script = document.createElement('script');
    script.src = 'js/translations.js';
    script.onload = () => {
        initializeApp();
    };
    script.onerror = () => {
        console.error('Failed to load translations, starting app in default English.');
        initializeApp();
    };
    document.head.appendChild(script);

    function initializeApp() {
        let allProducts = [];
        const priceLocale = currentLang === 'de' ? 'de-DE' : (currentLang === 'ru' ? 'ru-RU' : 'en-EG');

        // Global fetch of products (available on every page for search/autocomplete)
        const productsLoadedPromise = fetch(`data/products.json?_=${Date.now()}`)
            .then(response => response.json())
            .then(data => {
                allProducts = data;
                return allProducts;
            })
            .catch(error => {
                console.error('Error loading products globally:', error);
                return [];
            });

        // 1. Product Detail Page Logic
        const productDetailContainer = document.getElementById('product-detail-container');
        if (productDetailContainer) {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');

            if (productId) {
                fetch(`data/products.json?_=${Date.now()}`)
                    .then(response => response.json())
                    .then(data => {
                        // Fix: Compare string to string since JSON ids are numbers
                        const product = data.find(p => p.id.toString() === productId);
                        if (product) {
                            const formattedPrice = new Intl.NumberFormat(priceLocale, { style: 'currency', currency: 'EGP' }).format(product.price);
                            document.title = `${product.name} | Drink`;

                            const translatedCategory = (window.translations && window.translations[currentLang] && window.translations[currentLang][product.category]) 
                                ? window.translations[currentLang][product.category] 
                                : product.category;

                            const translatedDescription = translateDescription(product.description, product.name, currentLang);
                            
                            const abvText = currentLang === 'de' ? 'Vol.-%' : (currentLang === 'ru' ? '% алк.' : 'ABV');
                            const visitStoreText = (window.translations && window.translations[currentLang] && window.translations[currentLang]['Visit our store to purchase']) || 'Visit our store to purchase';
                            const notOnlineSaleText = (window.translations && window.translations[currentLang] && window.translations[currentLang]['*Not available for online sale']) || '*Not available for online sale';

                            // Add mobile responsive styling inline for the detail view
                            productDetailContainer.innerHTML = `
                                <div class="product-image-wrap" style="flex: 1; min-width: 300px;">
                                    <img src="${product.image}" alt="${product.name}" style="width: 100%; max-height: 500px; object-fit: contain; border-radius: 10px;">
                                </div>
                                <div class="product-info-wrap" style="flex: 1; display: flex; flex-direction: column; justify-content: center; min-width: 300px;">
                                    <div style="color: var(--accent); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">${translatedCategory}</div>
                                    <h1 style="font-size: 2.5rem; margin-bottom: 20px;">${product.name}</h1>
                                    <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 30px; flex-wrap: wrap;">
                                        <div style="font-size: 2rem; font-weight: 800;">${formattedPrice}</div>
                                        ${product.alcohol && product.alcohol !== '0%' ? `<div style="background: rgba(212, 175, 55, 0.15); border: 1px solid var(--accent); color: var(--accent); font-weight: 700; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem;">${product.alcohol} ${abvText}</div>` : ''}
                                    </div>
                                    <p style="font-size: 1.1rem; color: var(--text-muted); line-height: 1.8; margin-bottom: 40px;">
                                        ${translatedDescription || 'A premium beverage crafted for the discerning palate.'}
                                    </p>
                                    <div style="padding: 20px; border: 1px solid var(--accent); border-radius: 8px; text-align: center;">
                                        <p style="color: var(--accent); font-weight: 600;">${visitStoreText}</p>
                                        <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 5px;">${notOnlineSaleText}</p>
                                    </div>
                                </div>
                            `;
                            // Update container to wrap on mobile
                            productDetailContainer.style.flexWrap = 'wrap';
                        } else {
                            const notFoundText = (window.translations && window.translations[currentLang] && window.translations[currentLang]['Product not found.']) || 'Product not found.';
                            productDetailContainer.innerHTML = `<p>${notFoundText}</p>`;
                        }
                    })
                    .catch(error => {
                        console.error('Error loading product details:', error);
                        const loadErrorText = (window.translations && window.translations[currentLang] && window.translations[currentLang]['Error loading product details.']) || 'Error loading product details.';
                        productDetailContainer.innerHTML = `<p>${loadErrorText}</p>`;
                    });
            } else {
                const noProdText = (window.translations && window.translations[currentLang] && window.translations[currentLang]['No product specified.']) || 'No product specified.';
                productDetailContainer.innerHTML = `<p>${noProdText}</p>`;
            }
        }

        // 2. Catalog Page Logic
        const productsGrid = document.getElementById('products-grid');
        const categoryFilters = document.getElementById('category-filters');
        
        if (productsGrid && categoryFilters) {
            // Use globally fetched products
            productsLoadedPromise.then(data => {
                renderProducts(data, true);
            });

            // Category Scroll-To Navigation
            categoryFilters.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    const category = e.target.getAttribute('data-category');
                    
                    if (category === 'All') {
                        categoryFilters.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                        e.target.classList.add('active');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        const targetSection = document.getElementById(`category-section-${category.toLowerCase()}`);
                        if (targetSection) {
                            categoryFilters.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                            e.target.classList.add('active');
                            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                }
            });

            // Check URL parameters for category filtering (from homepage)
            const urlParams = new URLSearchParams(window.location.search);
            const initialCategory = urlParams.get('category');
            
            if (initialCategory) {
                setTimeout(() => {
                    const filterLi = document.querySelector(`li[data-category="${initialCategory}"]`);
                    if (filterLi) {
                        filterLi.click();
                    }
                }, 100);
            }

            // Render Function
            function renderProducts(products, groupByCategory = false) {
                productsGrid.innerHTML = '';
                
                if (products.length === 0) {
                    const noProdText = (window.translations && window.translations[currentLang] && window.translations[currentLang]['No products found']) || 'No products found.';
                    productsGrid.innerHTML = `<p style="color: #a0aab2; grid-column: 1/-1; text-align: center;">${noProdText}</p>`;
                    return;
                }

                if (groupByCategory) {
                    // Change grid to block container for sections
                    productsGrid.style.display = 'block';
                    
                    // Group by category
                    const groups = {};
                    products.forEach(p => {
                        const catName = p.category || 'Extras';
                        if (!groups[catName]) groups[catName] = [];
                        groups[catName].push(p);
                    });
                    
                    // Category display order
                    const categoryOrder = ['Wine', 'Spirits', 'Beer', 'RTDs', 'Snacks', 'Soft Drinks', 'Tobacco', 'Accessories', 'Extras'];
                    
                    categoryOrder.forEach(cat => {
                        const groupProducts = groups[cat];
                        if (groupProducts && groupProducts.length > 0) {
                            const section = document.createElement('div');
                            section.className = 'category-section';
                            section.id = `category-section-${cat.toLowerCase()}`;
                            section.style.marginBottom = '60px';
                            
                            const title = document.createElement('h2');
                            title.className = 'category-section-title';

                            const englishTitle = cat === 'Wine' ? 'Premium Wines' : 
                                                 cat === 'Spirits' ? 'Luxury Spirits' : 
                                                 cat === 'Beer' ? 'Craft Beers' : 
                                                 cat === 'RTDs' ? 'RTDs & Premixes' : 
                                                 cat === 'Snacks' ? 'Gourmet Snacks' : 
                                                 cat === 'Soft Drinks' ? 'Premium Soft Drinks' : 
                                                 cat === 'Tobacco' ? 'Select Tobacco' : cat;

                            title.innerText = (window.translations && window.translations[currentLang] && window.translations[currentLang][englishTitle])
                                ? window.translations[currentLang][englishTitle]
                                : englishTitle;

                            title.style.fontSize = '2rem';
                            title.style.borderBottom = '2px solid var(--accent)';
                            title.style.paddingBottom = '10px';
                            title.style.marginBottom = '25px';
                            title.style.color = 'var(--text-main)';
                            
                            const grid = document.createElement('div');
                            grid.className = 'products-grid';
                            grid.style.display = 'grid';
                            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
                            grid.style.gap = '30px';
                            
                            groupProducts.forEach(product => {
                                const card = createProductCard(product);
                                grid.appendChild(card);
                            });
                            
                            section.appendChild(title);
                            section.appendChild(grid);
                            productsGrid.appendChild(section);
                        }
                    });

                    // Scrollspy setup to highlight active category in sidebar as user scrolls
                    const observerOptions = {
                        root: null,
                        rootMargin: '-100px 0px -70% 0px',
                        threshold: 0
                    };
                    
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const sectionId = entry.target.id;
                                const catName = sectionId.replace('category-section-', '');
                                
                                categoryFilters.querySelectorAll('li').forEach(li => {
                                    const liCat = li.getAttribute('data-category').toLowerCase();
                                    if (liCat === catName) {
                                        categoryFilters.querySelectorAll('li').forEach(l => l.classList.remove('active'));
                                        li.classList.add('active');
                                    }
                                });
                            }
                        });
                    }, observerOptions);

                    const sections = productsGrid.querySelectorAll('.category-section');
                    sections.forEach(sec => observer.observe(sec));

                    // Scroll to top listener to reset to "All"
                    window.addEventListener('scroll', () => {
                        if (window.scrollY < 150) {
                            categoryFilters.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                            const allLi = categoryFilters.querySelector('li[data-category="All"]');
                            if (allLi) allLi.classList.add('active');
                        }
                    });
                    
                    // Trigger transitions
                    const cards = productsGrid.querySelectorAll('.product-card');
                    cards.forEach((card, index) => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.transition = 'all 0.4s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 15);
                    });
                } else {
                    // Single grid view
                    productsGrid.style.display = 'grid';
                    productsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
                    productsGrid.style.gap = '30px';
                    
                    products.forEach(product => {
                        const card = createProductCard(product);
                        productsGrid.appendChild(card);
                    });
                    
                    // Trigger transitions
                    const cards = productsGrid.querySelectorAll('.product-card');
                    cards.forEach((card, index) => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.transition = 'all 0.4s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 30);
                    });
                }
            }
        }

        // Shared product card creator (used by catalog, search, and category pages)
        function createProductCard(product) {
            const card = document.createElement('a');
            card.href = `product.html?id=${product.id}`;
            card.className = 'product-card';
            
            const formattedPrice = new Intl.NumberFormat(priceLocale, {
                style: 'currency',
                currency: 'EGP'
            }).format(product.price);

            const abvText = currentLang === 'de' ? 'Vol.-%' : (currentLang === 'ru' ? '% алк.' : 'ABV');
            const alcoholBadge = product.alcohol && product.alcohol !== '0%' ? `<span style="background: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.3); color: var(--accent); font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">${product.alcohol} ${abvText}</span>` : '';

            const translatedCategory = (window.translations && window.translations[currentLang] && window.translations[currentLang][product.category]) 
                ? window.translations[currentLang][product.category] 
                : product.category;

            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-img">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                    <div class="product-category" style="margin-bottom: 0;">${translatedCategory}</div>
                    ${alcoholBadge}
                </div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">${formattedPrice}</div>
            `;
            return card;
        }

        // 3. Global Floating Action Button (Call Us)
        const callFAB = document.createElement('a');
        callFAB.href = 'tel:+201551552171';
        callFAB.className = 'floating-call-btn';
        callFAB.setAttribute('aria-label', currentLang === 'de' ? 'Rufen Sie uns an' : (currentLang === 'ru' ? 'Позвонить нам' : 'Call Us'));
        callFAB.innerHTML = `
            <div class="fab-pulse"></div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
        `;
        document.body.appendChild(callFAB);

        // 4. Global Navbar Search Logic
        const searchInput = document.getElementById('global-search-input');
        const searchBtn = document.getElementById('global-search-btn');
        const searchWrapper = document.querySelector('.nav-search');
        let autocompleteDropdown = null;

        if (searchWrapper && searchInput) {
            autocompleteDropdown = document.createElement('div');
            autocompleteDropdown.className = 'nav-search-results';
            searchWrapper.appendChild(autocompleteDropdown);
        }

        function performSearch(query) {
            const portalGrid = document.getElementById('portal-grid');
            const portalSearchResults = document.getElementById('portal-search-results');
            const portalTitle = document.getElementById('portal-main-title');
            const portalSubtitle = document.getElementById('portal-main-subtitle');

            if (!query.trim()) {
                // Restore catalog hub view
                if (portalGrid && portalSearchResults) {
                    portalGrid.style.display = 'grid';
                    portalSearchResults.style.display = 'none';
                    if (portalTitle) portalTitle.style.display = 'block';
                    if (portalSubtitle) portalSubtitle.style.display = 'block';
                }

                if (productsGrid && typeof allProducts !== 'undefined' && !portalGrid) {
                    if (categoryFilters) {
                        categoryFilters.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                        const allLi = categoryFilters.querySelector('li[data-category="All"]');
                        if (allLi) allLi.classList.add('active');
                    }
                    renderProducts(allProducts, true);
                }
                
                const newUrl = `${window.location.pathname}`;
                window.history.replaceState({ path: newUrl }, '', newUrl);
                return;
            }
            
            // If we are on catalog portal hub
            if (portalGrid && portalSearchResults && typeof allProducts !== 'undefined') {
                portalGrid.style.display = 'none';
                portalSearchResults.style.display = 'block';
                if (portalTitle) portalTitle.style.display = 'none';
                if (portalSubtitle) portalSubtitle.style.display = 'none';

                const filtered = allProducts.filter(product => 
                    product.name.toLowerCase().includes(query.toLowerCase()) || 
                    product.category.toLowerCase().includes(query.toLowerCase())
                );
                
                const titleEl = document.getElementById('search-results-title');
                if (titleEl) {
                    if (currentLang === 'de') {
                        titleEl.innerHTML = `Suchergebnisse für "<span>${query}</span>"`;
                    } else if (currentLang === 'ru') {
                        titleEl.innerHTML = `Результаты поиска для "<span>${query}</span>"`;
                    } else {
                        titleEl.innerHTML = `Search Results for "<span>${query}</span>"`;
                    }
                }

                // Render matching products inside productsGrid container
                const resultsGrid = document.getElementById('products-grid');
                if (resultsGrid) {
                    resultsGrid.innerHTML = '';
                    if (filtered.length === 0) {
                        const noResultsText = (window.translations && window.translations[currentLang] && window.translations[currentLang]['No products found matching your search. Try another query!']) || 'No products found matching your search. Try another query!';
                        resultsGrid.innerHTML = `<p style="color: #a0aab2; grid-column: 1/-1; text-align: center; padding: 40px 0;">${noResultsText}</p>`;
                        return;
                    }
                    filtered.forEach(product => {
                        const card = createProductCard(product);
                        resultsGrid.appendChild(card);
                    });
                    
                    // Animation entrance
                    const cards = resultsGrid.querySelectorAll('.product-card');
                    cards.forEach((card, index) => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.transition = 'all 0.4s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 20);
                    });
                }

                const newUrl = `${window.location.pathname}?search=${encodeURIComponent(query)}`;
                window.history.replaceState({ path: newUrl }, '', newUrl);
            } else if (productsGrid && typeof allProducts !== 'undefined') {
                // Traditional catalog with category grouping
                const filtered = allProducts.filter(product => 
                    product.name.toLowerCase().includes(query.toLowerCase()) || 
                    product.category.toLowerCase().includes(query.toLowerCase())
                );
                
                if (categoryFilters) {
                    categoryFilters.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                }
                
                renderProducts(filtered, true); // Grouped matches
                
                const newUrl = `${window.location.pathname}?search=${encodeURIComponent(query)}`;
                window.history.replaceState({ path: newUrl }, '', newUrl);
            } else {
                window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
            }
        }

        if (searchInput) {
            let activeSuggestionIndex = -1;

            function updateActiveSuggestion(suggestions) {
                suggestions.forEach((el, idx) => {
                    if (idx === activeSuggestionIndex) {
                        el.classList.add('active');
                        el.scrollIntoView({ block: 'nearest' });
                    } else {
                        el.classList.remove('active');
                    }
                });
            }

            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase().trim();
                if (!query || !autocompleteDropdown) {
                    if (autocompleteDropdown) autocompleteDropdown.style.display = 'none';
                    return;
                }

                // Filter products that start with or contain the query
                const matches = allProducts.filter(p => 
                    p.name.toLowerCase().includes(query) || 
                    (p.category && p.category.toLowerCase().includes(query))
                );

                // Sort to prioritize names that start with the query
                matches.sort((a, b) => {
                    const aStarts = a.name.toLowerCase().startsWith(query);
                    const bStarts = b.name.toLowerCase().startsWith(query);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    return 0;
                });

                const topMatches = matches.slice(0, 5);
                autocompleteDropdown.innerHTML = '';
                activeSuggestionIndex = -1;

                if (topMatches.length === 0) {
                    const noResults = document.createElement('div');
                    noResults.className = 'suggestion-no-results';
                    noResults.innerText = (window.translations && window.translations[currentLang] && window.translations[currentLang]['No products found']) || 'No products found';
                    autocompleteDropdown.appendChild(noResults);
                } else {
                    topMatches.forEach(product => {
                        const item = document.createElement('a');
                        item.href = `product.html?id=${product.id}`;
                        item.className = 'autocomplete-suggestion';

                        const formattedPrice = new Intl.NumberFormat(priceLocale, {
                            style: 'currency',
                            currency: 'EGP'
                        }).format(product.price);

                        const abvText = currentLang === 'de' ? 'Vol.-%' : (currentLang === 'ru' ? '% алк.' : 'ABV');
                        const alcoholMeta = product.alcohol && product.alcohol !== '0%' ? ` • ${product.alcohol} ${abvText}` : '';
                        
                        const translatedCategory = (window.translations && window.translations[currentLang] && window.translations[currentLang][product.category]) 
                            ? window.translations[currentLang][product.category] 
                            : product.category;

                        item.innerHTML = `
                            <img src="${product.image}" alt="${product.name}">
                            <div class="suggestion-info">
                                <span class="suggestion-name">${product.name}</span>
                                <span class="suggestion-meta">${translatedCategory}${alcoholMeta}</span>
                            </div>
                            <span class="suggestion-price">${formattedPrice}</span>
                        `;

                        item.addEventListener('click', (e) => {
                            e.preventDefault();
                            window.location.href = `product.html?id=${product.id}`;
                        });

                        autocompleteDropdown.appendChild(item);
                    });

                    if (matches.length > 5) {
                        const viewAll = document.createElement('a');
                        viewAll.href = `catalog.html?search=${encodeURIComponent(query)}`;
                        viewAll.className = 'suggestion-view-all';

                        if (currentLang === 'de') {
                            viewAll.innerText = `Alle ${matches.length} Ergebnisse anzeigen`;
                        } else if (currentLang === 'ru') {
                            viewAll.innerText = `Показать все результаты (${matches.length})`;
                        } else {
                            viewAll.innerText = `View all ${matches.length} results`;
                        }

                        viewAll.addEventListener('click', (e) => {
                            e.preventDefault();
                            performSearch(query);
                            autocompleteDropdown.style.display = 'none';
                        });

                        autocompleteDropdown.appendChild(viewAll);
                    }
                }

                autocompleteDropdown.style.display = 'flex';
            });

            searchInput.addEventListener('keydown', (e) => {
                if (!autocompleteDropdown || autocompleteDropdown.style.display !== 'flex') {
                    if (e.key === 'Enter') {
                        performSearch(searchInput.value);
                    }
                    return;
                }

                const suggestions = autocompleteDropdown.querySelectorAll('.autocomplete-suggestion, .suggestion-view-all');

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
                    updateActiveSuggestion(suggestions);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
                    updateActiveSuggestion(suggestions);
                } else if (e.key === 'Escape') {
                    autocompleteDropdown.style.display = 'none';
                    searchInput.blur();
                } else if (e.key === 'Enter') {
                    if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                        e.preventDefault();
                        suggestions[activeSuggestionIndex].click();
                    } else {
                        performSearch(searchInput.value);
                        autocompleteDropdown.style.display = 'none';
                    }
                }
            });

            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim()) {
                    searchInput.dispatchEvent(new Event('input'));
                }
            });

            searchInput.addEventListener('blur', () => {
                setTimeout(() => {
                    if (autocompleteDropdown) {
                        autocompleteDropdown.style.display = 'none';
                    }
                }, 250);
            });

            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    performSearch(searchInput.value);
                    if (autocompleteDropdown) autocompleteDropdown.style.display = 'none';
                });
            }
            
            if (productsGrid) {
                const urlParams = new URLSearchParams(window.location.search);
                const searchParam = urlParams.get('search');
                if (searchParam) {
                    searchInput.value = searchParam;
                    productsLoadedPromise.then(() => {
                        performSearch(searchParam);
                    });
                }
            }
        }

        // 5. Global Age Verification Gate (Age Verification Wall)
        if (localStorage.getItem('age_verified') !== 'true') {
            // Prevent background page scroll while active
            document.body.style.overflow = 'hidden';

            const ageGateTitle = (window.translations && window.translations[currentLang] && window.translations[currentLang]['Welcome to DRINK']) || 'Welcome to DRINK';
            const ageGateDesc = (window.translations && window.translations[currentLang] && window.translations[currentLang]['You must be 21 years of age or older to view our premium beverage selection. Please verify your age to continue.']) || 'You must be 21 years of age or older to view our premium beverage selection. Please verify your age to continue.';
            const ageGateConfirm = (window.translations && window.translations[currentLang] && window.translations[currentLang]['Yes, I am 21+']) || 'Yes, I am 21+';
            const ageGateReject = (window.translations && window.translations[currentLang] && window.translations[currentLang]['Under 21']) || 'Under 21';

            const overlay = document.createElement('div');
            overlay.className = 'age-gate-overlay';
            overlay.innerHTML = `
                <div class="age-gate-modal">
                    <img src="images/logo.png" alt="DRINK Logo" class="age-gate-logo">
                    <h2>${ageGateTitle}</h2>
                    <p>${ageGateDesc}</p>
                    <div class="age-gate-buttons">
                        <button class="btn-age-confirm" id="age-confirm-btn">${ageGateConfirm}</button>
                        <button class="btn-age-reject" id="age-reject-btn">${ageGateReject}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            
            // Trigger show class for transition effect
            setTimeout(() => {
                overlay.classList.add('show');
            }, 10);

            // Yes button click
            document.getElementById('age-confirm-btn').addEventListener('click', () => {
                localStorage.setItem('age_verified', 'true');
                overlay.style.opacity = '0';
                document.body.style.overflow = 'auto';
                setTimeout(() => {
                    overlay.remove();
                }, 500);
            });

            // Under 21 button click
            document.getElementById('age-reject-btn').addEventListener('click', () => {
                window.location.href = 'https://www.responsibility.org/';
            });
        }

        // 6. Standalone Category Page Logic
        const categoryProductsGrid = document.getElementById('category-products-grid');
        if (categoryProductsGrid) {
            const currentCategory = document.body.getAttribute('data-category');
            if (currentCategory) {
                productsLoadedPromise.then(data => {
                    const filtered = data.filter(p => p.category && p.category.toLowerCase() === currentCategory.toLowerCase());
                    categoryProductsGrid.innerHTML = '';
                    
                    if (filtered.length === 0) {
                        categoryProductsGrid.innerHTML = '<p style="color: #a0aab2; grid-column: 1/-1; text-align: center; padding: 40px 0;">No products found in this category yet. Uploading soon!</p>';
                        return;
                    }
                    
                    filtered.forEach(product => {
                        const card = createProductCard(product);
                        categoryProductsGrid.appendChild(card);
                    });
                    
                    const cards = categoryProductsGrid.querySelectorAll('.product-card');
                    cards.forEach((card, index) => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.transition = 'all 0.4s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 20);
                    });
                });
            }
        }

        // Summer Offer Popup Logic
        const isHomePage = document.querySelector('.hero-slideshow');
        if (isHomePage) {
            function showSummerOfferPopup() {
                if (sessionStorage.getItem('summer_offer_shown') === 'true') return;
                
                const offerOverlay = document.createElement('div');
                offerOverlay.className = 'offer-popup-overlay';
                offerOverlay.style.cssText = `
                    position: fixed; inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 9998; display: flex; align-items: center; justify-content: center;
                    padding: 20px; opacity: 0; transition: opacity 0.4s ease;
                `;
                
                offerOverlay.innerHTML = `
                    <div class="offer-popup-modal" style="
                        background: var(--sand-bg);
                        border: 3px solid var(--brand-yellow);
                        border-radius: 20px;
                        padding: 10px; max-width: 500px; width: 100%; text-align: center;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255, 208, 40, 0.3);
                        position: relative; transform: scale(0.9);
                        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    ">
                        <button id="close-offer-btn" style="
                            position: absolute; top: -15px; right: -15px;
                            background: linear-gradient(135deg, var(--brand-yellow), var(--brand-orange));
                            color: white; border: 2px solid white; border-radius: 50%;
                            width: 35px; height: 35px; font-weight: bold; cursor: pointer;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex;
                            align-items: center; justify-content: center; font-size: 1.2rem;
                        ">&times;</button>
                        <img src="images/summer-offer.webp" alt="Summer Offer Deals" style="
                            width: 100%; height: auto; border-radius: 12px; display: block;
                        ">
                    </div>
                `;
                
                document.body.appendChild(offerOverlay);
                
                setTimeout(() => {
                    offerOverlay.style.opacity = '1';
                    offerOverlay.querySelector('.offer-popup-modal').style.transform = 'scale(1)';
                }, 100);
                
                const closeOffer = () => {
                    offerOverlay.style.opacity = '0';
                    offerOverlay.querySelector('.offer-popup-modal').style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        offerOverlay.remove();
                    }, 400);
                    sessionStorage.setItem('summer_offer_shown', 'true');
                };
                
                document.getElementById('close-offer-btn').addEventListener('click', closeOffer);
                offerOverlay.addEventListener('click', (e) => {
                    if (e.target === offerOverlay) closeOffer();
                });
            }
            
            // Show after age verification check
            if (localStorage.getItem('age_verified') === 'true') {
                // Show shortly after page loads
                setTimeout(showSummerOfferPopup, 1000);
            } else {
                // Wait for age gate confirm button to be clicked (in case page loaded first time)
                // Need to poll or wait for button click.
                document.addEventListener('click', (e) => {
                    if (e.target && e.target.id === 'age-confirm-btn') {
                        setTimeout(showSummerOfferPopup, 1500);
                    }
                });
            }
        }

        // 7. Robust JS Hero Slideshow Logic
        const slideshow = document.querySelector('.hero-slideshow');
        if (slideshow) {
            const slides = slideshow.querySelectorAll('.slide');
            if (slides.length > 0) {
                let currentSlide = 0;
                // Initialize slides
                slides.forEach((s, i) => {
                    s.style.opacity = i === 0 ? '1' : '0';
                    s.style.transition = 'opacity 1s ease-in-out';
                    s.style.position = 'absolute';
                    s.style.top = '0';
                    s.style.left = '0';
                    s.style.width = '100%';
                    s.style.height = '100%';
                    s.style.backgroundSize = 'cover';
                    s.style.backgroundPosition = 'center';
                });

                setInterval(() => {
                    slides[currentSlide].style.opacity = '0';
                    currentSlide = (currentSlide + 1) % slides.length;
                    slides[currentSlide].style.opacity = '1';
                }, 2500); // 2.5 seconds rotation
            }
        }

        // Apply translations to static elements
        if (currentLang !== 'en') {
            translatePage(currentLang);
        }

        // Inject custom language switcher widget
        injectLanguageSelector(currentLang);

        // Show page contents once translation completes
        if (currentLang !== 'en') {
            setTimeout(() => {
                document.documentElement.style.opacity = '1';
            }, 50);
        }
    }

    // --- Localization Helper Functions ---
    
    function translateDOM(element, lang) {
        if (!window.translations || !window.translations[lang]) return;
        const dict = window.translations[lang];

        if (element.nodeType === Node.TEXT_NODE) {
            const trimmed = element.nodeValue.trim();
            if (trimmed && dict[trimmed]) {
                element.nodeValue = element.nodeValue.replace(trimmed, dict[trimmed]);
            }
        } else {
            // Avoid scripts/styles/inputs
            if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;

            // Translate placeholder attributes
            if (element.placeholder && dict[element.placeholder.trim()]) {
                element.placeholder = dict[element.placeholder.trim()];
            }

            // Translate title attributes
            if (element.title && dict[element.title.trim()]) {
                element.title = dict[element.title.trim()];
            }

            // Recurse down children
            for (let child of element.childNodes) {
                translateDOM(child, lang);
            }
        }
    }

    function translatePage(lang) {
        translateDOM(document.body, lang);
        
        // Dynamic overrides
        const pageTitle = document.title;
        if (window.translations[lang] && window.translations[lang][pageTitle]) {
            document.title = window.translations[lang][pageTitle];
        } else if (pageTitle.includes('DRINK | Premium Beverage Retail in Hurghada')) {
            document.title = pageTitle.replace('DRINK | Premium Beverage Retail in Hurghada', 
                lang === 'de' ? 'DRINK | Premium-Getränke-Einzelhandel in Hurghada' : 'DRINK | Продажа премиальных напитков в Хургаде');
        }
    }

    function translateDescription(desc, name, lang) {
        if (lang === 'en' || !window.translations || !window.translations[lang]) return desc;
        
        let template = desc;
        if (name && desc.startsWith(name)) {
            template = desc.substring(name.length).trim();
        }
        
        const dict = window.translations[lang];
        if (dict && dict[template]) {
            return name ? `${name} ${dict[template]}` : dict[template];
        }
        
        return desc;
    }

    function injectLanguageSelector(currentLang) {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        const navSearch = document.querySelector('.nav-search');
        const switcher = document.createElement('div');
        switcher.className = 'lang-switcher';
        
        const languages = {
            'en': { name: 'EN', flag: '🇬🇧' },
            'de': { name: 'DE', flag: '🇩🇪' },
            'ru': { name: 'RU', flag: '🇷🇺' }
        };

        const activeLang = languages[currentLang] || languages['en'];

        switcher.innerHTML = `
            <button class="lang-select-btn" aria-label="Select Language">
                <span class="lang-flag">${activeLang.flag}</span>
                <span>${activeLang.name}</span>
            </button>
            <ul class="lang-dropdown">
                <li class="lang-option ${currentLang === 'en' ? 'active' : ''}" data-lang="en">
                    <span class="lang-flag">🇬🇧</span> English
                </li>
                <li class="lang-option ${currentLang === 'de' ? 'active' : ''}" data-lang="de">
                    <span class="lang-flag">🇩🇪</span> Deutsch
                </li>
                <li class="lang-option ${currentLang === 'ru' ? 'active' : ''}" data-lang="ru">
                    <span class="lang-flag">🇷🇺</span> Русский
                </li>
            </ul>
        `;

        // Position language selector before search bar
        if (navSearch) {
            navbar.insertBefore(switcher, navSearch);
        } else {
            navbar.appendChild(switcher);
        }

        const btn = switcher.querySelector('.lang-select-btn');
        const dropdown = switcher.querySelector('.lang-dropdown');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            switcher.classList.toggle('open');
        });

        document.addEventListener('click', () => {
            switcher.classList.remove('open');
        });

        switcher.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', () => {
                const selectedLang = option.getAttribute('data-lang');
                if (selectedLang !== currentLang) {
                    localStorage.setItem('drink_lang', selectedLang);
                    window.location.reload();
                }
            });
        });
    }
});
