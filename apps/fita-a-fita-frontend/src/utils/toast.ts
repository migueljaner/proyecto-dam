export const generateToast = (message: string, type: 'success' | 'error', duration: number = 3000) => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center p-4 mb-4 text-sm rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`;

    toast.innerHTML = `
        <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${type === 'success' ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M12 2L2 22h20L12 2z"/>'}
            </svg>
        </div>
        <div class="ml-3 text-sm font-normal">${message}</div>
    `;

    document.body.appendChild(toast);

    // Add fade-in animation
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';

    // Trigger reflow to enable animation
    toast.offsetHeight;
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300); // Wait for fade-out animation
    }, duration);
};
