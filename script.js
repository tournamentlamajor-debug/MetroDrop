"use strict";

document.documentElement.classList.add("js-ready");

const menuToggle = document.querySelector(".menu-toggle");
const mainMenu = document.querySelector(".main-nav");
const menuClickSound = new Audio("sounds/click_default.mp3");
menuClickSound.volume = 0.72;

const playClickSound = () => {
	menuClickSound.currentTime = 0;
	menuClickSound.play().catch(() => {});
};

menuToggle.addEventListener("click", () => {
	const isOpen = mainMenu.classList.toggle("is-open");
	menuToggle.classList.toggle("is-open", isOpen);
	menuToggle.setAttribute("aria-expanded", String(isOpen));
	menuToggle.querySelector(".visually-hidden").textContent = isOpen
		? "Закрыть меню"
		: "Открыть меню";
	playClickSound();
});

document.querySelectorAll(".mobile-menu-item").forEach((menuItem) => {
	menuItem.addEventListener("click", (event) => {
		if (menuItem.getAttribute("href")?.includes("#upgrade")) {
			event.preventDefault();
			giveEpicBackpack();
		}
		playClickSound();
		mainMenu.classList.remove("is-open");
		menuToggle.classList.remove("is-open");
		menuToggle.setAttribute("aria-expanded", "false");
		menuToggle.querySelector(".visually-hidden").textContent = "Открыть меню";
	});
});

document.querySelectorAll(".nav-link, .login-button, .auth-button, .form-submit, .form-back").forEach((button) => {
	button.addEventListener("click", playClickSound);
});

const authPanel = document.querySelector(".auth-panel");
const authChoice = authPanel?.querySelector(".auth-actions");
const authCopy = authPanel?.querySelector(".auth-copy");
const authLogo = authPanel?.querySelector(".auth-logo");
const authPage = document.querySelector(".auth-page");
const authForms = authPanel?.querySelectorAll(".auth-form");
const accountStorageKey = "metroDropAccount";

const normalizePlayerName = (name) => {
	const trimmedName = String(name).trim();
	if (trimmedName && trimmedName === trimmedName.toUpperCase()) {
		return trimmedName.toLowerCase().replace(/^\S/, (character) => character.toUpperCase());
	}
	return trimmedName;
};

const restoreProfileData = () => {
	const accountData = localStorage.getItem(accountStorageKey);
	if (!accountData) {
		return;
	}

	const account = JSON.parse(accountData);
	const profileName = document.querySelector('[data-profile="name"]');
	const profileId = document.querySelector('[data-profile="id"]');

	if (profileName) {
		profileName.textContent = normalizePlayerName(account.name);
	}
	if (profileId) {
		profileId.textContent = account.id;
	}
};

restoreProfileData();

document.querySelector("[data-copy-id]")?.addEventListener("click", async (event) => {
	const id = document.querySelector('[data-profile="id"]')?.textContent;
	const message = event.currentTarget.parentElement.querySelector(".copy-message");

	if (!id) {
		return;
	}

	try {
		await navigator.clipboard.writeText(id);
		message.textContent = "ID скопирован";
	} catch {
		message.textContent = "Не удалось скопировать";
	}

	setTimeout(() => {
		message.textContent = "";
	}, 1600);
});

const showAuthMessage = (message, isError = false, form = null) => {
	const formMessage = form?.querySelector(".form-message");
	if (!formMessage) {
		return;
	}
	formMessage.textContent = message;
	formMessage.classList.toggle("is-error", isError);
};

const showAuthForm = (formId) => {
	if (!authChoice || !authForms) {
		return;
	}
	authChoice.hidden = true;
	authCopy.hidden = true;
	authLogo.hidden = true;
	authForms.forEach((form) => {
		if (form.dataset.authForm === formId) {
			form.removeAttribute("hidden");
			form.classList.add("is-visible");
		} else {
			form.setAttribute("hidden", "");
			form.classList.remove("is-visible");
		}
	});
	authForms.forEach((form) => showAuthMessage("", false, form));
	const firstInput = document.querySelector(`[data-auth-form="${formId}"] input`);
	firstInput?.focus();
};

const showAuthChoice = () => {
	if (!authChoice || !authForms) {
		return;
	}
	authChoice.hidden = false;
	authCopy.hidden = false;
	authLogo.hidden = false;
	authForms.forEach((form) => {
		form.setAttribute("hidden", "");
		form.classList.remove("is-visible");
	});
	authForms.forEach((form) => showAuthMessage("", false, form));
};

const closeAuthPage = () => {
	if (authPage) {
		authPage.hidden = true;
	}
};

const restoreAuthState = () => {
	if (localStorage.getItem("metroDropLoggedIn") !== "true") {
		return;
	}

	const profileLinks = [
		document.querySelector(".main-nav > .nav-link"),
		document.querySelector(".mobile-menu-item"),
		document.querySelector(".login-button")
	];

	profileLinks.forEach((link) => {
		if (link) {
			link.textContent = "ПРОФИЛЬ";
			link.href = "profile.html";
		}
	});
	closeAuthPage();
};

restoreAuthState();

document.querySelectorAll("[data-auth-view]").forEach((button) => {
	button.addEventListener("click", () => showAuthForm(button.dataset.authView));
});

document.querySelectorAll(".form-back").forEach((button) => {
	button.addEventListener("click", showAuthChoice);
});

document.querySelector('input[name="id"]')?.addEventListener("input", (event) => {
	event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 11);
});

const playerNameInput = document.querySelector('input[name="name"]');
const validatePlayerName = () => {
	if (playerNameInput) {
		playerNameInput.setCustomValidity(
			/[A-Za-zА-Яа-яЁё]/.test(playerNameInput.value)
				? ""
				: "Имя игрока должно содержать хотя бы одну букву"
		);
	}
};

playerNameInput?.addEventListener("input", validatePlayerName);
validatePlayerName();

document.querySelectorAll(".auth-form").forEach((form) => {
	const submitButton = form.querySelector(".form-submit");
	const updateSubmitState = () => {
		submitButton.disabled = !form.checkValidity();
	};

	form.addEventListener("input", updateSubmitState);
	updateSubmitState();
});

document.querySelector('[data-auth-form="registration"]')?.addEventListener("submit", (event) => {
	event.preventDefault();
	const formData = new FormData(event.currentTarget);
	const account = {
		name: normalizePlayerName(formData.get("name")),
		id: formData.get("id"),
		password: formData.get("password")
	};
	const existingAccount = localStorage.getItem(accountStorageKey);

	if (existingAccount && JSON.parse(existingAccount).id === account.id) {
		showAuthMessage("Такой ID уже зарегистрирован.", true, event.currentTarget);
		return;
	}

	localStorage.setItem(accountStorageKey, JSON.stringify(account));
	localStorage.setItem("metroDropLoggedIn", "true");
	closeAuthPage();
});

document.querySelector('[data-auth-form="login"]')?.addEventListener("submit", (event) => {
	event.preventDefault();
	const formData = new FormData(event.currentTarget);
	const accountData = localStorage.getItem(accountStorageKey);
	const account = accountData ? JSON.parse(accountData) : null;
	const identifier = formData.get("identifier");

	if (!account || (account.name !== identifier && account.id !== identifier) || account.password !== formData.get("password")) {
		showAuthMessage("Неверное имя игрока, ID или пароль.", true, event.currentTarget);
		return;
	}

	localStorage.setItem("metroDropLoggedIn", "true");
	closeAuthPage();
});

const inventoryStorageKey = "metroDropInventory";

const renderInventory = () => {
	const inventorySlots = document.querySelectorAll("[data-inventory-slot]");
	const inventory = JSON.parse(localStorage.getItem(inventoryStorageKey) || "[]");

	inventorySlots.forEach((slot, index) => {
		const item = inventory[index];
		if (!item) {
			slot.replaceChildren();
			slot.classList.remove("has-item", "rarity-epic");
			return;
		}

		slot.classList.add("has-item", `rarity-${item.rarity}`);
		slot.innerHTML = `<img class="inventory-item-image" src="${item.image}" alt="${item.name}"><span class="inventory-rarity" aria-hidden="true"></span>`;
	});
};

const giveEpicBackpack = () => {
	const inventory = JSON.parse(localStorage.getItem(inventoryStorageKey) || "[]");
	if (!inventory.some((item) => item.image === "items/backpack_4.png")) {
		inventory.push({
			name: "РЮКЗАК",
			image: "items/backpack_4.png",
			rarity: "epic",
			rarityLabel: "ЭПИЧЕСКИЙ"
		});
		localStorage.setItem(inventoryStorageKey, JSON.stringify(inventory));
	}

	if (document.querySelector("[data-inventory-slot]")) {
		renderInventory();
	} else {
		window.location.href = "profile.html";
	}
};

renderInventory();